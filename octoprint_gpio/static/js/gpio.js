/*
 * View model for OctoPrint-GPIO
 *
 * Author: Bartek Kryza
 * License: AGPLv3
 */
$(function() {
  function GpioViewModel(parameters) {
    var self = this;

    self.pluginName = "gpio";

    self.gpioTypes = ko.observableArray();
    self.gpioSettings = ko.observableArray();
    self.gpioFactories = ko.observableArray();
    self.inputControls = ko.observableArray(["Button"]);
    self.outputControls = ko.observableArray(["Indicator"]);
    self.pwmControls = ko.observableArray(["Input", "Slider"]);
    self.servoControls = ko.observableArray(["Input", "Slider"]);

    self.loginStateViewModel = parameters[0];
    self.settingsViewModel = parameters[1];

    self.bindFromSettings = function() {
      self.gpioTypes(self.settingsViewModel.settings.plugins.gpio.gpioTypes());
      self.gpioFactories(self.settingsViewModel.settings.plugins.gpio.gpioFactories())
      self.gpioSettings(self.settingsViewModel.settings.plugins.gpio.bindings());
    };

    self.onBeforeBinding = function() {
      self.bindFromSettings();
    };

    self.onSettingsBeforeSave = function() {
      self.bindFromSettings();
    };
  }

  /* view model class, parameters for constructor, container to bind to
   * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
   * and a full list of the available options.
   */
  OCTOPRINT_VIEWMODELS.push({
    construct: GpioViewModel,
    // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
    dependencies: ["loginStateViewModel", "settingsViewModel"],
    // Elements to bind to, e.g. #settings_plugin_gpio, #tab_plugin_gpio, ...
    elements: ["#tab_plugin_gpio", "#settings_plugin_gpio"]
  });
});

