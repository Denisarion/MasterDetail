/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 MaterialID in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"jetcourses/MasterDetailApp/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"jetcourses/MasterDetailApp/test/integration/pages/App",
	"jetcourses/MasterDetailApp/test/integration/pages/Browser",
	"jetcourses/MasterDetailApp/test/integration/pages/Master",
	"jetcourses/MasterDetailApp/test/integration/pages/Detail",
	"jetcourses/MasterDetailApp/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "jetcourses.MasterDetailApp.view."
	});

	sap.ui.require([
		"jetcourses/MasterDetailApp/test/integration/MasterJourney",
		"jetcourses/MasterDetailApp/test/integration/NavigationJourney",
		"jetcourses/MasterDetailApp/test/integration/NotFoundJourney",
		"jetcourses/MasterDetailApp/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});