/**
@module ember
*/

import { context } from '@ember/-internals/environment';
import { get, Mixin, computed } from '@ember/-internals/metal';
import { EMBER_MODERNIZED_BUILT_IN_COMPONENTS } from '@ember/canary-features';
import { assert, deprecate } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

if (DEBUG && EMBER_MODERNIZED_BUILT_IN_COMPONENTS) {
  Mixin._disableDebugSeal = true;
}

/**
`Ember.TargetActionSupport` is a mixin that can be included in a class
to add a `triggerAction` method with semantics similar to the Handlebars
`{{action}}` helper. In normal Ember usage, the `{{action}}` helper is
usually the best choice. This mixin is most often useful when you are
doing more complex event handling in Components.

@class TargetActionSupport
@namespace Ember
@extends Mixin
@private
*/
const TargetActionSupport = Mixin.create({
  target: null,
  action: null,
  actionContext: null,

  actionContextObject: computed('actionContext', function () {
    let actionContext = get(this, 'actionContext');

    if (typeof actionContext === 'string') {
      let value = get(this, actionContext);
      if (value === undefined) {
        value = get(context.lookup, actionContext);
      }
      return value;
    } else {
      return actionContext;
    }
  }),

  /**
  Send an `action` with an `actionContext` to a `target`. The action, actionContext
  and target will be retrieved from properties of the object. For example:

  ```javascript
  import { alias } from '@ember/object/computed';

  App.SaveButtonView = Ember.View.extend(Ember.TargetActionSupport, {
    target: alias('controller'),
    action: 'save',
    actionContext: alias('context'),
    click() {
      this.triggerAction(); // Sends the `save` action, along with the current context
                            // to the current controller
    }
  });
  ```

  The `target`, `action`, and `actionContext` can be provided as properties of
  an optional object argument to `triggerAction` as well.

  ```javascript
  App.SaveButtonView = Ember.View.extend(Ember.TargetActionSupport, {
    click() {
      this.triggerAction({
        action: 'save',
        target: this.get('controller'),
        actionContext: this.get('context')
      }); // Sends the `save` action, along with the current context
          // to the current controller
    }
  });
  ```

  The `actionContext` defaults to the object you are mixing `TargetActionSupport` into.
  But `target` and `action` must be specified either as properties or with the argument
  to `triggerAction`, or a combination:

  ```javascript
  import { alias } from '@ember/object/computed';

  App.SaveButtonView = Ember.View.extend(Ember.TargetActionSupport, {
    target: alias('controller'),
    click() {
      this.triggerAction({
        action: 'save'
      }); // Sends the `save` action, along with a reference to `this`,
          // to the current controller
    }
  });
  ```

  @method triggerAction
  @param opts {Object} (optional, with the optional keys action, target and/or actionContext)
  @return {Boolean} true if the action was sent successfully and did not return false
  @private
  */
  triggerAction(opts = {}) {
    let { action, target, actionContext } = opts;
    action = action || get(this, 'action');
    target = target || getTarget(this);

    if (actionContext === undefined) {
      actionContext = get(this, 'actionContextObject') || this;
    }

    if (target && action) {
      let ret;

      if (target.send) {
        ret = target.send(...[action].concat(actionContext));
      } else {
        assert(
          `The action '${action}' did not exist on ${target}`,
          typeof target[action] === 'function'
        );
        ret = target[action](...[].concat(actionContext));
      }

      if (ret !== false) {
        return true;
      }
    }

    return false;
  },
});

function getTarget(instance) {
  let target = get(instance, 'target');
  if (target) {
    if (typeof target === 'string') {
      let value = get(instance, target);
      if (value === undefined) {
        value = get(context.lookup, target);
      }

      return value;
    } else {
      return target;
    }
  }

  if (instance._target) {
    return instance._target;
  }

  return null;
}

if (EMBER_MODERNIZED_BUILT_IN_COMPONENTS) {
  Object.defineProperty(TargetActionSupport, '_wasReopened', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: false,
  });

  Object.defineProperty(TargetActionSupport, 'reopen', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function reopen(...args) {
      if (this === TargetActionSupport) {
        deprecate('Reopening Ember.TargetActionSupport is deprecated.', false, {
          id: 'ember.built-in-components.reopen',
          for: 'ember-source',
          since: {
            enabled: '3.27.0',
          },
          until: '4.0.0',
          url: 'https://deprecations.emberjs.com/v3.x#toc_ember-built-in-components-reopen',
        });

        TargetActionSupport._wasReopened = true;
      }

      return Mixin.prototype.reopen.call(this, ...args);
    },
  });

  if (DEBUG) {
    Object.seal(TargetActionSupport);
    Mixin._disableDebugSeal = false;
  }
}

export default TargetActionSupport;
