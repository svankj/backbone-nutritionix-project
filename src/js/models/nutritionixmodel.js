/**
 * @file Backbone Model
 * @name Backbone Nutritionix Project
 * @copyright 2016 svankj
 */
$(function() {
	'use strict';
	window.app = window.app || { };

	/**
	 * Food Model
	*/
	window.app.Food = Backbone.Model.extend({
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
	 * Food Store Model
	*/
	window.app.FoodStore = Backbone.Model.extend({
		defaults:{
			title: '',
			calories: 0
		}
	});

});