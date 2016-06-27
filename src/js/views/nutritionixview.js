/**
 * @file Backbone View
 * @name Backbone Nutritionix Project
 * @copyright 2016 svankj
 */
$(function() {
	'use strict';
	// Constant Enter Key value
	window.app = window.app || { };
	var ENTER_KEY = 13;

	/**
	 * This view turns a Food model into HTML
	*/
	window.app.FoodView = Backbone.View.extend({
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
			this.$el.addClass('food-left');
			var data = { title: this.model.get("title"), calories: this.model.get("calories") };
			var tmplStr = '<input type="checkbox" class="food-left-input" value="1" name="<%= title %>"> <%= title %>'+
			'<span class="food-left-span">cal <%= calories %></span>';
			var tmpl = _.template(tmplStr);
			this.$el.html(tmpl(data));
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
				var food = new window.app.FoodStore({ title: this.model.get('title'), calories: this.model.get('calories')});
				window.app.foodsRight.add(food);
				// Save element in local storage
				food.save();
			}
			else
				window.app.foodsRight.remove(this.model.get('title'));
		}
	});

	/**
	 * This view turns a Food Store model into HTML
	*/
	window.app.FoodStoreView = Backbone.View.extend({
		// Tag element li
		tagName: 'li',
		/**
		 * Render function
		 * @returns {this}
		*/
		render: function() {
			// Create the HTML
			this.$el.addClass('food-right');
			var data = { title: this.model.get("title"), calories: this.model.get("calories") };
			var tmpl = _.template('<div name="<%= title %>"> <%= title %><span class="food-right-span">cal <%= calories %></span></div>');
			this.$el.html(tmpl(data));
			// Returning the object to make chaining possible
			return this;
		}
	});

	/**
	 * This view displays the search element
	*/
	window.app.SearchView = Backbone.View.extend({
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
				$('.box:nth-of-type(1)').prepend('<div class="loading"></div>');
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
							_.invoke(window.app.foodsLeft.toArray(), 'destroy');
							// Remove the old elements from the view
							window.app.appView.remove();
							// Add the new elements found to the collection
							data.hits.forEach( function(element, index) {
								var item = element.fields;
								var check = false;
								// Verify if item to be checked or not
								window.app.foodsRight.each(function (itemFoodR) {
									if(itemFoodR.get('title') === item.item_name) {
										check = true;
									}
								});
								window.app.foodsLeft.add(new window.app.Food({ title: item.item_name, calories: item.nf_calories, checked: check }));
							});
						}
						else window.app.appView.renderError(undefined);
						// Remove loading animation
						setTimeout(function() {
							$(".loading").remove();
						}, 500);
					}).fail(function (message) { // Fail function
						$(".loading").remove();
						window.app.appView.renderError(message);
					});
			}
		},
		/**
		 * Render function
		 * @returns {this}
		*/
		render: function(){
			// Create the HTML
			this.$el.html('<h1 class="head-title">Search food: <input type="text" class="search"></h1>');
			// Returning the object to make chaining possible
			return this;
		}
	});

	/**
	 * Main view of the application
	*/
	window.app.AppView = Backbone.View.extend({
		// Base the view on an existing element
		el: $('body'),
		/**
		 * Initialize function
		*/
		initialize: function() {
			// Retrieves models from the local storage
			window.app.foodsRight.fetch();
			// Some selectors
			this.listLeft = $('.foods-left');
			this.totalRight = $('.total-right-span');
			this.listRight = $('.foods-right');
			this.search = $('header');
			this.error = $('.error-msg');
			// Hide element when list is empty
			$('.foods-left:empty').parent().css('display', 'none');
			if(window.app.foodsRight.length === 0) $('.foods-right:empty').parent().css('visibility', 'hidden');
			// Add search view
			var searchView = new window.app.SearchView();
			this.search.append(searchView.render().el);
			// Listen for the add event on the left foods collection
			this.listenTo(window.app.foodsLeft, 'add', this.renderAddLeft);
			// Listen for the add/remove event on the right foods collection
			this.listenTo(window.app.foodsRight, 'add remove', this.renderAddRemoveRight);
			// Listen for the change event on the left foods collection
			this.listenTo(window.app.foodsLeft, 'change', this.renderChange);
			// Create views for every one of the right foods in the
			// collection and add them to the page
			var totalRight = 0;
			window.app.foodsRight.each(function(food) {
				totalRight += food.get('calories');
				window.app.foodStoreView = new window.app.FoodStoreView({ model: food });
				this.listRight.append(window.app.foodStoreView.render().el);
			}, this); // "this" is the context in the callback
			// Update the total right calories
			$('.total-right').empty();
			var data = { totalRight: totalRight.toFixed(2) };
			var tmpl = _.template('total cal: <span class="total-right-span"> <%= totalRight %></span>');
			$('.total-right').append(tmpl(data));
		},
		/**
		 * Render function for Add event
		 * @returns {this}
		*/
		renderAddLeft: function() {
			var len = window.app.foodsLeft.length-1;
			var foodView = new window.app.FoodView({ model: window.app.foodsLeft.models[len] });
			this.listLeft.append(foodView.render().el);
			// Show element when list is not empty
			if(len > 0) $('.foods-left').parent().css('display', 'block');
			return this;
		},
		/**
		 * Render function for Add event
		 * @returns {this}
		*/
		renderAddRemoveRight: function() {
			$('.foods-right').empty();
			for(var i=0; i<window.app.foodsRight.length; i++) {
				window.app.foodStoreView = new window.app.FoodStoreView({ model: window.app.foodsRight.models[i] });
				this.listRight.append(window.app.foodStoreView.render().el);
			}
			// Show/hide element when list isn't/is empty
			if(window.app.foodsRight.length > 0)
				$('.foods-right').parent().css('visibility', 'visible');
			else
				$('.foods-right:empty').parent().css('visibility', 'hidden');
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
			window.app.foodsRight.each(function(food) {
				totalRight += food.get('calories');
			});
			if(e.attributes !== undefined)
				if(e.attributes.checked)
					totalRight += e.attributes.calories;
				else
					totalRight -= e.attributes.calories;
			// Update the total right calories
			$('.total-right').empty();
			$('.total-right').append('total cal: <span class="total-right-span"> '+totalRight.toFixed(2)+'</span>');
			$('.foods-left').empty();
			$('.foods-left:empty').parent().css('display', 'none');
			return this;
		},
		/**
		 * Remove function
		*/
		remove: function () {
			$('.foods-left').empty();
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
			var data = { statusTextData: statusText, statusData: status,  errorMessageData: errorMessage };
			var tmplStr = '<div class="alert alert-danger fade in"><a href="#" class="close" data-dismiss="alert">&times;</a><strong>Error: </strong>'+
			'<%= statusTextData %> <br><strong>Code: </strong><%= statusData %><br><strong>Message: </strong><%= errorMessageData %></div>'
			var tmpl = _.template(tmplStr);
			this.error.html(tmpl(data));
			// Returning the object to make chaining possible
			return this;
		}
	});

});