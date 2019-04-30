import Helper from "@ember/component/helper";
import { getOwner } from "@ember/application";
import { isPresent } from "@ember/utils";

export function hrefTo(context, params) {
  let routing = getOwner(context).lookup("service:-routing");
  return routing.generateURL(...getParamsForGenerateURL(params));
}

function getParamsForGenerateURL(params) {
  params = params.slice(); // create a copy
  let targetRouteName = params.shift(); // the first param is always the target route name
  let lastParam = params[params.length - 1]; // the last param might be queryParams
  let queryParams;
  if (lastParam && lastParam.isQueryParams) {
    queryParams = params.pop().values;
  } else {
    queryParams = {};
  }

  // Filter out any items that aren't present
  let models = params.filter(item => isPresent(item)); // the remainder are the models

  return [targetRouteName, models, queryParams];
}

export default Helper.extend({
  compute(params, namedArgs) {
    if (namedArgs.params) {
      return hrefTo(this, namedArgs.params);
    } else {
      return hrefTo(this, params);
    }
  }
});
