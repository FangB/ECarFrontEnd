// constructor
(function($, ECar) {
	ECar.countDown = function(time) {
		if (!(this instanceof ECar.countDown)) {
			return new ECar.countDown(time);
		}
		this._time = time;
		if (isNaN(this._time)) {
			throw TypeError("参数time错误");
		}
		this._deferred = $.Deferred();
		this._promise = this._deferred.promise();
		this._timeoutId;
		this._intervalIdArr = [];
		this._started = false;
		this._intervalArr = [];
	};
	ECar.countDown.prototype = function() {
		// private functions
		function inUnacceptableState() {
			return !this._deferred ||
				this._deferred.state() !== "pending" ||
				this._started;
		}

		function startInterval( /*number*/ time, /*function*/ callback, /*object*/ context) {
			var timeRemaining = this._time,
				intervalId;

			intervalId = setInterval($.proxy(function() {
				timeRemaining -= time;
				// for edge cases:
				// eg: ECar.countDown(10*1000).every(1000, cb).done(cb);
				// 要求: every的cb调用的次数为9，而不是10
				// 实测：reset被调用了，理论上interval被clear了，但是实测还是被调用了
				this._deferred && this._deferred.notify({
					remain: timeRemaining,
					id: intervalId
				});
			}, this), time);

			this._intervalIdArr.push(intervalId);

			this._promise.progress(function(args) {
				if (args.id !== intervalId) return;
				return callback.call(context, args.remain);
			});
		}

		function reset() {
			// clean up;
			if (this._timeoutId !== undefined) {
				clearTimeout(this._timeoutId);
				this._timeoutId = undefined;
			} // timeout
			if (this._intervalIdArr.length) { // interval
				$.each(this._intervalIdArr, function(idx, ele) {
					clearInterval(ele);
				});
				this._intervalIdArr.length = 0;
			}
			this._deferred = null;
			this._promise = null;
			this._started = false;
		}

		return {
			constructor: ECar.countDown,

			every: function( /*number*/ time, /*function*/ callback, /*object*/ context) {
				if (inUnacceptableState.call(this)) return;
				this._intervalArr.push([time, callback, context]);
				return this;
			},

			done: function( /*function*/ callback, /*object*/ context) {
				if (inUnacceptableState.call(this)) return;
				this._promise.done(!!context ? $.proxy(callback, context) : callback);
				return this;
			},

			start: function( /*number*/ delay) { // delay feature not implemented
				if (inUnacceptableState.call(this)) return;

				this._timeoutId = setTimeout($.proxy(function() {
					this._deferred.resolve();
					reset.call(this);
				}, this), this._time);
				
				$.each(this._intervalArr, $.proxy(function(idx, ele) {
					startInterval.apply(this, ele);
				}, this));
				this._started = true;

				return this;
			},

			terminate: function( /*boolean*/ calldone) {
				if (!this._started) return; // terminate failed
				calldone ? this._deferred.resolve() : this._deferred.reject();

				reset.call(this);
				return this;
			}
		};
	}();
}(jQuery, window.ECar || (window.ECar = {})));