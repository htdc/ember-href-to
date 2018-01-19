import LinkComponent from '@ember/routing/link-component';
import { isPresent } from "@ember/utils";

export default class {

  constructor(applicationInstance, event, target = event.target) {
    this.applicationInstance = applicationInstance;
    this.event = event;
    this.target = target;
    let hrefAttr = this.target.attributes.href;
    this.url = hrefAttr && hrefAttr.value;
  }

  maybeHandle() {
    if (this.shouldHandle()) {
      return this.handle();
    }

    // Add extra check for native app behaviour
    if (this.shouldHandleAsExternalNativeLink()) {
      return this.handleAsExternalNativeLink();
    }
  }

  shouldHandle() {
    return this.isUnmodifiedLeftClick() &&
      this.isNotIgnored() &&
      this.hasNoTargetBlank() &&
      this.hasNoActionHelper() &&
      this.hasNoDownload() &&
      this.isNotLinkComponent() &&
      this.recognizeUrl();
  }

  shouldHandleAsExternalNativeLink() {
    return this.isUnmodifiedLeftClick() &&
      this.isNotIgnored() &&
      this.hasNoActionHelper() &&
      this.hasNoDownload() &&
      this.isNotLinkComponent() &&

      // Additional checks
      this.hasUrl() &&
      this.isNativeBuild() && // For native app builds only
      !this.recognizeUrl(); // Confirm its not an internal link
  }

  // Standard ember-href-to behavour
  handle() {
    let router = this._getRouter();
    router.transitionTo(this.getUrlWithoutRoot());
    this.event.preventDefault();
  }

  /*
   * In order to open external links in the mobile devices system browser, we need to
   * pass '_system' through to the open method. This method has been overwritten by the
   * cordova inappbrowser plugin so external links can successfully "escape" the webview
   * on IOS (Works on android as well, although not explicitly required).
   */
  handleAsExternalNativeLink() {
    window.open(this.url, '_system');
    this.event.preventDefault();
  }

  hasUrl() {
    return isPresent(this.url);
  }

  isUnmodifiedLeftClick() {
    let e = this.event;

    return (e.which === undefined || e.which === 1) && !e.ctrlKey && !e.metaKey;
  }

  hasNoTargetBlank() {
    let attr = this.target.attributes.target;
    return !attr || attr.value !== '_blank';
  }

  isNotIgnored() {
    return !this.target.attributes['data-href-to-ignore'];
  }

  hasNoActionHelper() {
    return !this.target.attributes['data-ember-action'];
  }

  hasNoDownload() {
    return !this.target.attributes.download;
  }

  isNotLinkComponent() {
    let isLinkComponent = false;
    let id = this.target.id;
    if (id) {
      let componentInstance = this.applicationInstance.lookup('-view-registry:main')[id];
      isLinkComponent = componentInstance && componentInstance instanceof LinkComponent;
    }

    return !isLinkComponent;
  }

  recognizeUrl() {
    let url = this.url;
    let didRecognize = false;

    if (url) {
      let router = this._getRouter();
      let rootUrl = this._getRootUrl();
      let isInternal = url.indexOf(rootUrl) === 0;
      let urlWithoutRoot = this.getUrlWithoutRoot();
      let routerMicrolib = router._router._routerMicrolib || router._router.router;

      didRecognize = isInternal && routerMicrolib.recognizer.recognize(urlWithoutRoot);
    }

    return didRecognize;
  }

  isNativeBuild() {
    return this._getPlatformService().isNativeBuild;
  }

  getUrlWithoutRoot() {
    let url = this.url;
    let rootUrl = this._getRootUrl();
    return url.substr(rootUrl.length - 1);
  }

  _getRouter() {
    return this.applicationInstance.lookup('service:router');
  }

  _getPlatformService() {
    return this.applicationInstance.lookup('service:platform');
  }

  _getRootUrl() {
    let router = this._getRouter();
    let rootURL = router.get('rootURL');

    // Add the hash to the front of the url if we are in native app build
    if (this.isNativeBuild()) {
      rootURL = '#' + rootURL;
    }

    if (rootURL.charAt(rootURL.length - 1) !== '/') {
      rootURL = rootURL + '/';
    }

    return rootURL;
  }
}
