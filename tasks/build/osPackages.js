module.exports = function (grunt) {
  const { resolve } = require('path');
  const { indexBy } = require('lodash');

  const { config } = grunt;
  const exec = require('../utils/exec');
  const targetDir = config.get('target');
  const version = config.get('pkg.version');
  const userScriptsDir = config.get('userScriptsDir');
  const servicesByName = indexBy(config.get('services'), 'name');

  grunt.registerTask('_build:osPackages', function () {
    grunt.config.get('platforms').forEach(({ name, buildDir }) => {
      // TODO(sissel): Check if `fpm` is available
      if (!(/linux-x(86|64)$/.test(name))) return;

      const arch = /x64$/.test(name) ? 'x86_64' : 'i686';
      const fpm = args => exec('fpm', args);

      const args = [
        '--force',
        '--package', targetDir,
        '-s', 'dir', // input type
        '--name', 'kibana',
        '--version', version,
        '--after-install', resolve(userScriptsDir, 'installer.sh'),
        '--after-remove', resolve(userScriptsDir, 'remover.sh'),
        '--config-files', '/opt/kibana/config/kibana.yml'
      ];

      const files = buildDir + '/=/opt/kibana';
      const sysv = servicesByName.sysv.outputDir + '/etc/=/etc/';
      const systemd = servicesByName.systemd.outputDir + '/lib/=/lib/';

      //Manually find flags, multiple args without assignment are not entirely parsed
      var flags = grunt.option.flags().join(',');

      const buildDeb = !!flags.match('deb');
      const buildRpm = !!flags.match('rpm');
      const noneSpecified = !buildRpm && !buildDeb;

      grunt.file.mkdir(targetDir);
      if (buildDeb || noneSpecified) {
        fpm(args.concat('-t', 'deb', '-a', arch, files, sysv, systemd));
      }
      if (buildRpm || noneSpecified) {
        fpm(args.concat('-t', 'rpm', '-a', arch, '--rpm-os', 'linux', files, sysv, systemd));
      }

    });
  });
};
