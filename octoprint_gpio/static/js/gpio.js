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
    self.enabledControls = ko.observableArray();

    self.loginStateViewModel = parameters[0];
    self.settingsViewModel = parameters[1];

    self.bindFromSettings = function() {
      self.gpioTypes(self.settingsViewModel.settings.plugins.gpio.gpioTypes());
      self.gpioFactories(self.settingsViewModel.settings.plugins.gpio.gpioFactories())
      self.gpioSettings(self.settingsViewModel.settings.plugins.gpio.bindings());
      var controls = [];
      ko.utils.arrayForEach(self.gpioSettings(), function(item) {
        value = ko.observable();
        value.subscribe(function(newValue) {
          OctoPrint.simpleApiCommand("gpio", "set_gpio", {
              "gpio": parseInt(item.gpio()),
              "value": parseInt(newValue)
            })
            .done(function(data) {});
        });

        if (item.type()[0] !== 'UNDEFINED') {
          item.value = value;
          item.id = "GPIO" + item.gpio();
          controls.push(item);
        }
      });
      self.enabledControls(controls);
    };

    self.onBeforeBinding = function() {
      self.bindFromSettings();
    };

    self.onSettingsBeforeSave = function() {
      self.bindFromSettings();
    };
  }

  // Custom binding for slider control
  ko.bindingHandlers.sliderRange = {
    init: function(element, valueAccessor, allBindingsAccessor) {
      var options = allBindingsAccessor().sliderOptions || {};
      $(element).slider(options);
      ko.utils.registerEventHandler(element, "slidechange", function(event, ui) {
        var observable = valueAccessor();
        observable.Min(ui.values[0]);
        observable.Max(ui.values[1]);
      });
      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        $(element).slider("destroy");
      });
      ko.utils.registerEventHandler(element, "slide", function(event, ui) {
        var observable = valueAccessor();
        observable.Min(ui.values[0]);
        observable.Max(ui.values[1]);
      });
    },
    update: function(element, valueAccessor, allBindingsAccessor) {
      var value = ko.utils.unwrapObservable(valueAccessor());
      if (isNaN(value.Min())) value.Min(0);
      if (isNaN(value.Max())) value.Max(0);

      $(element).slider("option", allBindingsAccessor().sliderOptions);
      $(element).slider("values", 0, value.Min());
      $(element).slider("values", 1, value.Max());
    }
  };

  // Custom binding for Bootstrap radio button group
  ko.bindingHandlers.radioButtonGroup = {
    init: function(element, valueAccessor, allBindings, viewModel, context) {
      var $buttons, $element, observable;
      observable = valueAccessor();
      if (!ko.isWriteableObservable(observable)) {
        throw "You must pass an observable or writeable computed";
      }
      $element = $(element);
      if ($element.hasClass("btn")) {
        $buttons = $element;
      } else {
        $buttons = $(".btn", $element);
      }
      elementBindings = allBindings();
      $buttons.each(function() {
        var $btn, btn, radioValue;
        btn = this;
        $btn = $(btn);
        radioValue = elementBindings.radioValue ||
          $btn.attr("data-value") || $btn.attr("value") || $btn.text();
        $btn.on("click", function() {
          observable(ko.utils.unwrapObservable(radioValue));
        });
        return ko.computed({
          disposeWhenNodeIsRemoved: btn,
          read: function() {
            $btn.toggleClass("active", observable() === ko.utils.unwrapObservable(radioValue));
          }
        });
      });
    }
  };

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

