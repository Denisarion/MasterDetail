sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/MessageToast",
	"sap/ui/comp/smarttable/SmartTable",
	"sap/ui/comp/smartfilterbar/SmartFilterBar",
	"sap/m/OverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/m/OverflowToolbarButton",
	"sap/m/OverflowToolbarToggleButton",
	"sap/m/ObjectStatus",
	"sap/m/Button",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox"

], function(BaseController, JSONModel, formatter, MessageToast, SmartTable, SmartFilterBar, OverflowToolbar, ToolbarSpacer,
	OverflowToolbarButton, OverflowToolbarToggleButton, ObjectStatus, Button, Filter, FilterOperator, Fragment, MessageBox) {
	"use strict";

	return BaseController.extend("jetcourses.MasterDetailApp.controller.Detail", {

		formatter: formatter,

		_mFilters: {
			activeVersion: new Filter("Version", FilterOperator.NE, "D"),
			deactiveVersion: new Filter("Version", FilterOperator.EQ, "D")
		},

		_oViewModel: new JSONModel({
			button: {
				visible: {
					Create: true,
					Update: true,
					DeactivateDelete: true,
					Restore: true,
					Refresh: true,
					Copy: true,
					ChangeSelectionMode: true,
					ChangeVersionMode: true
				},
				pressed: {
					ChangeSelectionMode: false,
					ChangeVersionMode: false
				}
			},
			table: {
				selectionMode: "Single",
				selectedItemsCount: 0
			},
			dialog: {
				title: "",
				inputValue: "",
				mode: "",
				updatePath: "",
				label: "",
				nameField: "",
				idField: ""
			}
		}),

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(this._oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {

			var sEntity = oEvent.getParameter("arguments").entity;
			this.getModel().metadataLoaded().then(function() {
				this.byId("thDetail").setText(this.getModel("i18n").getResourceBundle().getText("t" + sEntity));
				this._loadTable(sEntity);
				this.getModel("detailView").setProperty("/dialog/idField", this._oSmartTable.getEntitySet().slice(16, -1) + "ID");
				this.getModel("detailView").setProperty("/dialog/nameField", this._oSmartTable.getEntitySet().slice(16, -1) + "Text");
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */

		_loadTable: function(sEntity) {

			this._oSmartFilterBar = new SmartFilterBar({
				id: "sf" + sEntity,
				entitySet: "zjblessons_base_" + sEntity,
				liveMode: true,
				enableBasicSearch: false,
				useToolbar: true
			});

			var aToolbarElements = [
				new OverflowToolbarToggleButton({
					icon: "{i18n>iChangeSelectionMode}"
				}),
				new Button({
					text: "{i18n>infSelectedItems} {detailView>/table/selectedItemsCount}"
				}),
				new OverflowToolbarToggleButton({
					icon: "{i18n>iDeactivateMode}"
				}),
				new ObjectStatus({
					text: "{i18n>infDeactivatedModeOn}"
				}),
				
				new ToolbarSpacer(),
				
				new OverflowToolbarButton({
					icon: "{i18n>iCreate}"
				}),
				new OverflowToolbarButton({
					icon: "{i18n>iCopy}"
				}),
				new OverflowToolbarButton({
					icon: "{i18n>iRefresh}"
				})
			];

			this._oSmartTable = new SmartTable({
				entitySet: "zjblessons_base_" + sEntity,
				editable: false,
				smartFilterId: "sf" + sEntity,
				tableType: "Table",
				useExportToExcel: true,
				editTogglable: false,
				useVariantManagement: false,
				useTablePersonalisation: true,
				showVariantManagement: true,
				header: " ",
				showRowCount: true,
				enableAutoBinding: true,
				showFullScreenButton: true,
				visible: true,
				beforeRebindTable: this._onBeforeRebindTable.bind(this),
				customToolbar: new OverflowToolbar({
					design: "Transparent",
					content: aToolbarElements

				})
			});

			this._oTable = this._oSmartTable.getTable();
			this._oTable.bindProperty("selectionMode", {
				path: "detailView>/table/selectionMode"
			});
			this._oSmartTable.setHeader(this.getResourceBundle().getText("tableHeader"));
			this._oTable.setSelectionMode("Single");
			this._oTable.setSelectionBehavior("Row");
			this._oTable.attachRowSelectionChange(this.onSelectionChange.bind(this));

			this.getModel("detailView").setProperty("/table/selectedItemsCount", 0);
			this.getModel("detailView").setProperty("/table/selectionMode", "Single");
			this.getModel("detailView").setProperty("/button/pressed/ChangeSelectionMode", false);
			this.getModel("detailView").setProperty("/button/pressed/ChangeVersionMode", false);

			var oRowActionTemplate = new sap.ui.table.RowAction({
				items: [
					new sap.ui.table.RowActionItem({
						icon: "{i18n>iEdit}",
						type: "Custom",
						text: "{i18n>ttEdit}",
						visible: "{= ${detailView>/button/visible/Update} && !${detailView>/button/pressed/ChangeVersionMode} }"
					})
				]
			});

			this._oTable.setRowActionTemplate(oRowActionTemplate);
			this._oTable.setRowActionCount(1);

			this.getView().byId("page").setContent(this._oSmartTable);

			this.getView().byId("page").destroyHeaderContent();
			this.getView().byId("page").addHeaderContent(this._oSmartFilterBar);
		},

		onSelectionChange: function() {
			this.getModel("detailView").setProperty("/table/selectedItemsCount", this._oTable.getSelectedIndices().length);

		},

		_onBeforeRebindTable: function(oEvent) {

			if (oEvent) {
				var sFilterKey = this.getModel("detailView").getProperty("/button/pressed/ChangeVersionMode") ? "deactiveVersion" :
					"activeVersion",
					oFilter = this._mFilters[sFilterKey];
				oEvent.getParameter("bindingParams").filters.push(oFilter);
			}
		},

		_onMetadataLoaded: function() {

			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			oViewModel.setProperty("/delay", 0);

			oViewModel.setProperty("/busy", true);

			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});