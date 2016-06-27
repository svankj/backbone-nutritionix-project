/**
 * @file Backbone Collection
 * @name Backbone Nutritionix Project
 * @copyright 2016 svankj
 */
$(function() {
	'use strict';
	window.app = window.app || { };

	/**
	 * Food Collection
	*/
	window.app.FoodList = Backbone.Collection.extend({
		model: window.app.Food,
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

	/**
	 * Food Store Collection
	*/
	window.app.FoodStoreList = Backbone.Collection.extend({
		model: window.app.FoodStore,
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

});