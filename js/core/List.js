define(["js/core/EventDispatcher","js/core/Bindable", "underscore"], function (EventDispatcher, Bindable, _) {


    var List = Bindable.inherit("js.core.List", {
        /**
         * List constructor
         * @param [Object] items to add
         * @param Object attributes to set
         */
        ctor: function (items, attributes) {
            this.$items = [];
            this.$itemEventMap = {};

            this.callBase(attributes);

            if (items) {
                this.add(items);
            }

            var self = this;

            function updateLength(){
                self.length = self.size();
            }

            // TODO: allow array here to give multiple event hin
            this.bind('add', updateLength);
            this.bind('remove', updateLength);
            this.bind('reset', updateLength);

            this.length = this.size();
        },
        /**
         *
         * @return {Boolean} true if list has items
         */
        isEmpty: function () {
            return this.$items.length === 0;
        }.on('*'),
        /**
         * Pushes one item to the list
         * @param item
         */
        push: function (item) {
            this.add(item);
        },
        /**
         * Removes last item  of the list
         * @return {*}
         */
        pop: function () {
            return this.removeAt(this.$items.length);
        },
        /**
         * Removes first item of list
         * @return {*}
         */
        shift: function () {
            return this.removeAt(0,{});
        },
        /**
         * Adds item to first position of list
         * @param item
         */
        unshift: function (item) {
            this.add(item,0);
        },
        /**
         * This method adds one ore items to the array.
         * @param items
         * @param options
         */
        add: function (items, options) {


            options = options || {};
            _.defaults(options, {silent: false, index: this.$items.length});

            var index = options.index;

            if (!_.isArray(items)) {
                items = [items];
            }
            var item, itemIndex;
            for (var i = 0; i < items.length; i++) {
                item = items[i];
                if (item instanceof Bindable) {
                    item.bind('change', this._onItemChange, this);
                    item.bind('*', this._onItemEvent, this);
                }
                itemIndex = index + i;
                this.$items[itemIndex] = item;
                if (options.silent !== true) {
                    this.trigger('add', {item: item, index: itemIndex})
                }
            }
        },
        /**
         *
         * @param e
         * @param item
         * @private
         */
        _onItemChange: function (e, item) {
            this.trigger('change', {item: item, index: this.indexOf(item), changedAttributes: e.$});
        },
        _onItemEvent: function(e, item){
            if(this.$itemEventMap[e.$.eventType]){
                var listeners = this.$itemEventMap[e.$.eventType],
                    listener;
                for(var i = 0; i < listeners.length; i++){
                    listener = listeners[i];
                    this.trigger(listener.eventType, {item: item, index: this.indexOf(item), itemEvent: e}, listener.callback, listener.scope);
                }
            }
        },
        /**
         * Removes an Array or just one item from the list. Triggers remove events.
         * @param Object | [Object] items
         * @param options
         */
        remove: function (items, options) {

            if (!_.isArray(items)) {
                items = [items];
            }
            for (var i = 0; i < items.length; i++) {
                this.removeAt(this.indexOf(items[i]), options);
            }
        },
        /**
         * Returns the index of the item
         * @param item
         * @return {*}
         */
        indexOf: function(item){
            return this.$items.indexOf(item);
        },
        /**
         * Removes one item a specific index and triggers remove event
         * @param index
         * @param options
         * @return {*}
         */
        removeAt: function (index, options) {
            options = options || {};

            if (index > -1 && index < this.$items.length) {
                var items = this.$items.splice(index, 1), item = items[0];
                if (options.silent !== true) {
                    this.trigger('remove', {item: item, index: index});
                }
                if (item instanceof Bindable) {
                    item.unbind('*', this._onItemEvent, this);
                    item.unbind('change', this._onItemChange, this);
                }
                return items[0];
            }
            return null;
        },
        /**
         * Resets the list with the given items and triggers reset event
         * @param items
         */
        reset: function (items, options) {
            var self = this;
            this.each(function(item){
                if(item instanceof EventDispatcher){
                    item.unbind('*',self._onItemEvent, self);
                    item.unbind('change',self._onItemChange, self);
                }
            });

            this.$items = items;
            this.each(function(item){
                if (item instanceof EventDispatcher) {
                    item.bind('*', self._onItemEvent, self);
                    item.bind('change', self._onItemChange, self);
                }
            });

            options = options || {};
            if(!options.silent){
                this.trigger('reset', {items: items});
            }
        },
        /**
         * Sorts the list by the given function and triggers sort event
         * @param fnc
         */
        sort: function (fnc) {
            this.trigger('sort', {items: this.$items.sort(fnc), sortFnc: fnc});
        },
        /**
         * Clears all items and triggers reset event
         */
        clear: function (options) {
            this.reset([],options);
        },
        /**
         * Returns the size of the list
         */
        size: function () {
            return this.$items.length;
        }.on('*'),

        /**
         * Returns item at a specific index
         * @param index
         * @return {*}
         */
        at: function (index) {
            if (index < this.$items.length && index >= 0) {
                return this.$items[index];
            }
            return null;
        }.on('*'),
        /**
         * Iterates over all items with given callback
         * @param Function callback with signature function(item, index)
         * @param Object The call scope of the callback
         */
        each: function (fnc, scope) {
            scope = scope || this;

            if (scope['break']) {
                throw "each would overwrite break";
            }

            if (scope['return']) {
                throw "each would overwrite return";
            }

            var b = false,
                r,
                error;

            scope['break'] = function () {
                b = true;
            };

            scope['return'] = function (value) {
                b = true;
                r = value;
            };

            for (var i = 0; i < this.$items.length; i++) {
                try {
                    fnc.call(scope, this.$items[i], i, this.$items);
                } catch(e) {
                    error = e;
                    b = true;
                }

                if (b) {
                    break;
                }
            }

            if (error) {
                throw error;
            }


            delete scope['break'];
            delete scope['return'];

            return r;
        },

        includes: function(item){
            var ret = this.each(function(innerItem){
                if(innerItem === item){
                    this["return"](true);
                }
            });
            if(ret){
                return ret;
            }else{
                return false;
            }
        }.on('*'),

        /**
         * Returns a fresh copy of the List
         * @return List a fresh copy of the list
         */
        clone: function(){
            var attributes = this._cloneAttribute(this.$);
            var items = this._cloneAttribute(this.$items);
            var ret = new this.factory(items,attributes);
            ret._$source = this;
            return ret;
        },

        sync: function(){
            if(this._$source){
                var item, items = [];
                for(var i = 0; i < this.$items.length; i++){
                    item = this.$items[i];
                    if(item instanceof Bindable && item.sync()){
                        item = item._$source;
                    }
                    items.push(item);
                }
                this._$source.reset(items);
            }
            return this.callBase();
        },

        destroy: function(){
            this.$itemEventMap = {};
            this.callBase();
        },

        bind: function(eventType, callback, scope){
            var i = eventType.indexOf("item:");
            if(i === 0){
                var itemEvent = eventType.substr("item:".length);
                this.$itemEventMap[itemEvent] = this.$itemEventMap[itemEvent] || [];
                this.$itemEventMap[itemEvent].push({
                    eventType: eventType,
                    callback: callback,
                    scope: scope
                });
            }
            this.callBase();
        },

        unbind: function(eventType, callback, scope){
            var i = eventType.indexOf("item:");
            if (i === 0) {
                var itemEvent = eventType.substr("item:".length),
                    listeners = this.$itemEventMap[itemEvent] || [],
                    listener;

                for(var j = listeners.length - 1; j > -1; j--){
                    listener = listeners[j];
                    if(listener.callback === callback && listener.scope === scope){
                        listeners.splice(i, 1);
                    }
                }
            } else {
                this.callBase();
            }
        }
    });

    return List;
});