/**
 * @file Provides Backbone framework for handle the foods calories list
 * @name Backbone Nutritionix Project
 * @copyright 2016 svankj
 */
$(function() {
	'use strict';
	window.app = window.app || { };
	// Food Left Collection
	window.app.foodsLeft = new window.app.FoodList([]);
	// Food Right Collection
	window.app.foodsRight = new window.app.FoodStoreList();
	// Main App
	window.app.appView = new window.app.AppView();
});