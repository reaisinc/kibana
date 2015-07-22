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

        autoload: kibana.autoload.require.concat(
          'plugins/kibana/discover',
          'plugins/kibana/visualize',
          'plugins/kibana/dashboard',
          'plugins/kibana/settings',
          'plugins/kibana/settings/sections',
          'plugins/kibana/doc',
          'plugins/kibana/settings/sections',
          'ui/vislib',
          'ui/agg_response',
          'ui/agg_types',
          'leaflet'
        ),

        constants: function (server, options) {
          return {
            defaultAppId: options.defaultAppId
          };
        }
      }
    }
  });

};
