import {
  Paths,
  HmrBrowserSyncConfig,
  LIVE_RELOAD_PROXY,
  LiveReloadBrowserSyncConfig,
  HMR_PROXY
} from './utils/gulp-config';
import { exec } from 'child_process';
import * as gulp from 'gulp';
import * as typescript from 'gulp-typescript';
import * as browserSync from 'browser-sync';
import * as nodemon from 'gulp-nodemon';
import * as compodoc from '@compodoc/gulp-compodoc';
import * as env from 'gulp-env';

// Pipeline
import {
  buildApp,
  rebuildApp,
  buildElectron,
  setHmrVariable,
  setLaunchVariable,
  setLiveReloadVariable,
  proxyInit,
  proxyReload
} from './utils/gulp-series';

import {
  launchElectron,
  startCompodoc,
  startHMR
} from './utils/gulp-parallel';

function serveLiveReload(done) {
  nodemon({
    exec: `electron ${Paths.electron_dest}main`,
    watch: [Paths.electron_dest]
  }).on('start', () => {
    try {
      const active = browserSync.get('Live-Proxy');
      if (active) {
        active.reload();
        done();
      }
    } catch (err) {
      proxyInit(LIVE_RELOAD_PROXY, LiveReloadBrowserSyncConfig);
      done();
    }
  });
}

function serveElectronHmr(done) {
  nodemon({
    exec: `electron ${Paths.electron_dest}main`,
    watch: [Paths.electron_dest]
  }).on('start', () => {
    try {
      const active = browserSync.get('HMR-Proxy');
      if (active) {
        active.reload();
        done();
      }
    } catch (err) {
      proxyInit(HMR_PROXY, HmrBrowserSyncConfig);
      done();
    }
  });
}

gulp.task('build:electron', buildElectron);

gulp.task('build:app', buildApp);

gulp.task('launch:var', setLaunchVariable);

gulp.task('launch:electron', launchElectron);

gulp.task('rebuild:app', rebuildApp);

gulp.task('serve:live-reload', serveLiveReload);

gulp.task('live-reload:var', setLiveReloadVariable);

gulp.task('hmr:var', setHmrVariable);

gulp.task('serve:hmr', startHMR);

gulp.task('serve:electron-hmr', serveElectronHmr);

gulp.task('start:docs', startCompodoc);

// Parallel.
gulp.task('watch:electron', done => {
  gulp.watch(Paths.electron_src, buildElectron);
  done();
});

gulp.task('watch:app', done => {
  gulp.watch(Paths.app_src, rebuildApp);
  done();
});

// Chains.
gulp.task(
  'live-reload',
  gulp.series('build:app', 'build:electron', 'live-reload:var', gulp.parallel('watch:electron', 'serve:live-reload'))
);

gulp.task(
  'hmr',
  gulp.series('build:electron', 'hmr:var', gulp.parallel('serve:hmr', 'watch:electron', 'serve:electron-hmr'))
);

gulp.task('launch', gulp.series('build:app', 'build:electron', 'launch:var', 'launch:electron'));
