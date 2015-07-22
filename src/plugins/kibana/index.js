module.exports = function (kibana) {
  return new kibana.Plugin({

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        defaultAppId: Joi.string().default('discover'),
        index: Joi.string().default('.kibana'),
        buildNum: Joi.string().default('@@buildNum')
      }).default();
    },

    uiExports: {
      app: {
        title: 'Kibana',
        description: 'the kibana you know and love',
        icon: 'plugins/kibana/settings/sections/about/barcode.svg',
        main: 'plugins/kibana/kibana',
        uses: [
          'visTypes',
          'spyModes'
        ],
        constants: function (server, options) {
          return {
            defaultAppId: options.defaultAppId
          };
        }
      }
    }
  });

};
