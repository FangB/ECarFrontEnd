// ECar.countDown.js

// module pattern
(function($, ECar) {
	ECar.countDown = function(time) {
		// defensive
		var _time = parseFloat(time);
		if (isNaN(_time)) {
			throw TypeError("参数time错误");
		}

		// private data
		var _deferred = $.Deferred(),
			_promise = _deferred.promise(),
			_timeoutId,
			_intervalIdArr = [],
			_started = false,
			_intervalArr = [];

		// private function
		function inUnacceptableState() {
			return !_deferred || _deferred.state() !== "pending" || _started;
		}

		function startInterval( /*number*/ time, /*function*/ callback, /*object*/ context) {
			var timeRemaining = _time,
				intervalId;

			intervalId = setInterval(function() {
				timeRemaining -= time;
				// for edge cases:
				// eg: ECar.countDown(10*1000).every(1000, cb).done(cb);
				// 要求: every的cb调用的次数为9，而不是10
				// 实测：reset被调用了，理论上interval被clear了，但是实测还是被调用了
				_deferred && _deferred.notify({
					remain: timeRemaining,
					id: intervalId
				});
			}, time);

			_intervalIdArr.push(intervalId);

			_promise.progress(function(args) {
				if (args.id !== intervalId) return;
				return callback.call(context, args.remain);
			});
		}

		function reset() {
			// clean up;
			if (_timeoutId !== undefined) {
				clearTimeout(_timeoutId);
				_timeoutId = undefined;
			} // timeout
			if (_intervalIdArr.length) { // interval
				$.each(_intervalIdArr, function(idx, ele) {
					clearInterval(ele);
				});
				_intervalIdArr.length = 0;
			}
			_deferred = null;
			_promise = null;
			_started = false;
		}

		return {
			every: function( /*number*/ time, /*function*/ callback, /*object*/ context) {
				if (inUnacceptableState()) return;
				_intervalArr.push([time, callback, context]);
				return this;
			},

			done: function( /*function*/ callback, /*object*/ context) {
				if (inUnacceptableState()) return;
				_promise.done(!!context ? $.proxy(callback, context) : callback);
				return this;
			},

			start: function( /*number*/ delay) { // delay feature not implemented
				if (inUnacceptableState()) return;

				_timeoutId = setTimeout(function() {
					_deferred.resolve();
					reset();
				}, _time);
				// 
				$.each(_intervalArr, function(idx, ele) {
					startInterval.apply(null, ele);
				});
				_started = true;

				return this;
			},

			terminate: function( /*boolean*/ calldone) {
				if (!_started) return; // terminate failed
				calldone ? _deferred.resolve() : _deferred.reject();

				reset();
				return this;
			}
		};
	};
}(jQuery, window.ECar || (window.ECar = {})));

