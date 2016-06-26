/**
 * @file Provides Backbone framework for handle the foods calories list
 * @name Backbone Nutritionix Project
 * @copyright 2016 svankj
 */
$(function() {

	// Constant Enter Key value
	var ENTER_KEY = 13;
	// Food View
	var foodView;
	// Food Left Collection
	var foodsLeft,
	// Food Right Collection
	foodsRight;

	/**
	 * Food Model
	*/
	var Food = Backbone.Model.extend({
		defaults: {
			title: '',
			calories: 0,
			checked: false
		},
		/**
		 * Function for checking/unchecking a food
		*/
		toggle: function() {
			this.set('checked', !this.get('checked'));
		}
	});

	/**
	 * Food Collection
	*/
	var FoodList = Backbone.Collection.extend({
		model: Food,
		/**
		 * Add function
		 * @param {Food} food
		*/
		add: function(food) {
			// Check for duplicates
			var isDupl = this.any(function(_food) {
				return _food.get('title') === food.get('title');
			});
			if (isDupl) {
				return false;
			}
			// Override the add function
			Backbone.Collection.prototype.add.call(this, food);
		},
		/**
		 * Return an array only with the checked foods
		 * @returns {Array}
		*/
		getChecked: function() {
			return this.where({checked:true});
		}
	});

	foodsLeft = new FoodList([]);

	/**
	 * This view turns a Food model into HTML
	*/
	var FoodView = Backbone.View.extend({
		// Tag element li
		tagName: 'li',
		// Handle the click event
		events: {
			'click': 'toggleFood'
		},
		/**
		 * Initialize function
		*/
		initialize: function() {
			// Set up event listeners. The change backbone event
			// is raised when a property changes (like the checked field)
			this.listenTo(this.model, 'change', this.render);
		},
		/**
		 * Render function
		 * @returns {this}
		*/
		render: function() {
			// Create the HTML
			this.$el.html('<input type="checkbox" value="1" name="' + this.model.get('title') + '" > ' + this.model.get('title') + '<span>cal ' + this.model.get('calories') + '</span>');
			this.$('input').prop('checked', this.model.get('checked'));
			// Returning the object to make chaining possible
			return this;
		},
		/**
		 * Toogle function
		*/
		toggleFood: function() {
			this.model.toggle();
			if(this.model.get('checked')) {
				var food = new FoodStore({ title: this.model.get('title'), calories: this.model.get('calories')});
				foodsRight.add(food);
				// Save element in local storage
				food.save();
			}
			else
				foodsRight.remove(this.model.get('title'));
		}
	});

	/**
	 * Food Store Model
	*/
	var FoodStore = Backbone.Model.extend({
		defaults:{
			title: '',
			calories: 0
		}
	});

	/**
	 * Food Store Collection
	*/
	var FoodStoreList = Backbone.Collection.extend({
		model: FoodStore,
		// Local storage structure
		localStorage: new Backbone.LocalStorage("food-list"),
		/**
		 * Add function
		 * @param {Food} food
		*/
		add: function(food) {
			// Check for duplicates
			var isDupl = this.any(function(_food) {
				return _food.get('title') === food.get('title');
			});
			if (isDupl) {
				return false;
			}
			// Override the add function
			Backbone.Collection.prototype.add.call(this, food);
		},
		/**
		 * Remove function
		 * @param {String} foodTitle
		*/
		remove: function (foodTitle) {
			var self = this;
			self.each(function (item, index) {
				if(item.get('title') === foodTitle) {
					// Remove element from local storage
					self.at(index).destroy();
					//self.remove(self.at(index));
				}
			});
			// Override the remove function
			Backbone.Collection.prototype.remove.call(self, foodTitle);
		}
	});

	foodsRight = new FoodStoreList();
	// Retrieves models from the local storage
	foodsRight.fetch();

	/**
	 * This view turns a Food Store model into HTML
	*/
	var FoodStoreView = Backbone.View.extend({
		// Tag element li
		tagName: 'li',
		/**
		 * Render function
		 * @returns {this}
		*/
		render: function() {
			// Create the HTML
			this.$el.html('<div name="' + this.model.get('title') + '" > ' + this.model.get('title') + '<span>cal ' + this.model.get('calories') + '</span></div>');
			// Returning the object to make chaining possible
			return this;
		}
	});

	/**
	 * This view displays the search element
	*/
	var SearchView = Backbone.View.extend({
		// Tag element header
		tagName: 'header',
		// Handle the keydown event
		events: {
			'keydown .search': 'search'
		},
		/**
		 * Search function
		 * @param {Object} e
		*/
		search: function(e) {
			// Only when Enter pressed
			if (e.which === ENTER_KEY) {
				// Loading animation
				$('div.box:nth-of-type(1)').prepend('<div class="loading"></div>');
				// Get the input value
				var search = this.$('.search').val().toLowerCase();
				// Ajax call to Nutritionix service to get foods and calories related
				Backbone.ajax({
					type: 'GET',
					url: 'https://api.nutritionix.com/v1_1/search/'+search+'?results=0:20&fields=item_name,nf_calories&appId=798c174d&appKey=c611abeca967abfb180066d0ba82e589',
					dataType: 'json'
					}).done(function (data) { // Done function
						if(data.hits.length > 0) {
							// Empty the food collection
							_.invoke(foodsLeft.toArray(), 'destroy');
							// Remove the old elements from the view
							app.remove();
							// Add the new elements found to the collection
							data.hits.forEach( function(element, index) {
								var item = element.fields;
								var check = false;
								// Verify if item to be checked or not
								foodsRight.each(function (itemFoodR) {
									if(itemFoodR.get('title') === item.item_name) {
										check = true;
									}
								});
								foodsLeft.add(new Food({ title: item.item_name, calories: item.nf_calories, checked: check }));
							});
						}
						else app.renderError(undefined);
						// Remove loading animation
						setTimeout(function() {
							$(".loading").remove();
						}, 500);
					}).fail(function (message) { // Fail function
						$(".loading").remove();
						app.renderError(message);
					});
			}
		},
		/**
		 * Render function
		 * @returns {this}
		*/
		render: function(){
			// Create the HTML
			this.$el.html('<h1 id="headTitle">Search food: <input type="text" class="search"></h1>');
			// Returning the object to make chaining possible
			return this;
		}
	});

	/**
	 * Main view of the application
	*/
	var App = Backbone.View.extend({
		// Base the view on an existing element
		el: $('body'),
		/**
		 * Initialize function
		*/
		initialize: function() {
			// Some selectors
			this.listLeft = $('#foods-left');
			this.totalRight = $('#total-right span');
			this.listRight = $('#foods-right');
			this.search = $('header');
			this.error = $('div.error-msg');
			// Hide element when list is empty
			$('ul#foods-left:empty').parent().css('display', 'none');
			if(foodsRight.length === 0) $('ul#foods-right:empty').parent().css('visibility', 'hidden');
			// Add search view
			var searchView = new SearchView();
			this.search.append(searchView.render().el);
			// Listen for the add event on the left foods collection
			this.listenTo(foodsLeft, 'add', this.renderAddLeft);
			// Listen for the add/remove event on the right foods collection
			this.listenTo(foodsRight, 'add remove', this.renderAddRemoveRight);
			// Listen for the change event on the left foods collection
			this.listenTo(foodsLeft, 'change', this.renderChange);
			// Create views for every one of the right foods in the
			// collection and add them to the page
			var totalRight = 0;
			foodsRight.each(function(food) {
				totalRight += food.get('calories');
				foodStoreView = new FoodStoreView({ model: food });
				this.listRight.append(foodStoreView.render().el);
			}, this); // "this" is the context in the callback
			// Update the total right calories
			$('p#total-right').empty();
			$('p#total-right').append('total cal: <span> '+totalRight.toFixed(2)+'</span>');
		},
		/**
		 * Render function for Add event
		 * @returns {this}
		*/
		renderAddLeft: function() {
			var len = foodsLeft.length-1;
			foodView = new FoodView({ model: foodsLeft.models[len] });
			this.listLeft.append(foodView.render().el);
			// Show element when list is not empty
			if(len > 0) $('ul#foods-left').parent().css('display', 'block');
			return this;
		},
		/**
		 * Render function for Add event
		 * @returns {this}
		*/
		renderAddRemoveRight: function() {
			$('#foods-right').empty();
			for(var i=0; i<foodsRight.length; i++) {
				foodStoreView = new FoodStoreView({ model: foodsRight.models[i] });
				this.listRight.append(foodStoreView.render().el);
			}
			// Show/hide element when list isn't/is empty
			if(foodsRight.length > 0)
				$('ul#foods-right').parent().css('visibility', 'visible');
			else
				$('ul#foods-right:empty').parent().css('visibility', 'hidden');
			return this;
		},
		/**
		 * Render function for Change event
		 * @param {Object} e
		 * @returns {this}
		*/
		renderChange: function(e) {
			// Calculate the total right calories amount
			var totalRight = 0;
			foodsRight.each(function(food) {
				totalRight += food.get('calories');
			});
			if(e.attributes !== undefined)
				if(e.attributes.checked)
					totalRight += e.attributes.calories;
				else
					totalRight -= e.attributes.calories;
			// Update the total right calories
			$('p#total-right').empty();
			$('p#total-right').append('total cal: <span> '+totalRight.toFixed(2)+'</span>');
			$('#foods-left').empty();
			$('ul#foods-left:empty').parent().css('display', 'none');
			return this;
		},
		/**
		 * Remove function
		*/
		remove: function () {
			$('#foods-left').empty();
		},
		/**
		 * Remove function
		 * @param {Object} message
		 * @returns {this}
		*/
		renderError: function (message) {
			// Create the HTML
			var objErrorMsg = (message !== undefined && message.responseText !== '')?JSON.parse(message.responseText):undefined;
			var errorMessage = (objErrorMsg !== undefined)?objErrorMsg.error_message:"Nutritionix didn't send back any data";
			var statusText = (message !== undefined)?message.statusText:"error";
			var status = (message !== undefined)?message.status:0;
			var html= '<div class="alert alert-danger fade in">'+
					'<a href="#" class="close" data-dismiss="alert">&times;</a>'+
					'<strong>Error: </strong>'+statusText+' <br><strong>Code: </strong>'+
					status+'<br>'+
					'<strong>Message: </strong>'+errorMessage+'</div>';
			this.error.html(html);
			// Returning the object to make chaining possible
			return this;
		}
	});

	var app = new App();

});