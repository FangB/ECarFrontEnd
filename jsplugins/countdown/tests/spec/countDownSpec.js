var ECar = window.ECar;
describe("ECar.countDown", function() {
  var countDown;

  beforeEach(function() {
    countDown = ECar.countDown(10 * 1000);
  });

  afterEach(function() {
    countDown.terminate(true);
    countDown = null;
  });

  it("创建时用不用new都一样", function() {
    var countDownWithNew = countDown,
      countDownWithoutNew = ECar.countDown(1000);
    expect(countDownWithNew instanceof ECar.countDown).toBe(true);
    expect(countDownWithoutNew instanceof ECar.countDown).toBe(true);
    countDownWithoutNew.terminate(true);
    countDownWithoutNew = null;
  });

  it("参数不是number类型时报错", function() {
    expect(function() {
      var countDown = ECar.countDown("你好");
    }).toThrowError("参数time错误");
  });

  describe("只有调用了start()才能开始倒计时", function() {
    var timerSpy;
    beforeEach(function() {
      jasmine.clock().install();
      timerSpy = jasmine.createSpy("timerSpy");
    });
    afterEach(function() {
      jasmine.clock().uninstall();
    });
    it("对于every是如此", function() {
      countDown.every(100, timerSpy);
      jasmine.clock().tick(101);
      expect(timerSpy).not.toHaveBeenCalled();
    });
    it("对于done是如此", function() {
      countDown.done(1000, timerSpy);
      jasmine.clock().tick(1000);
      expect(timerSpy).not.toHaveBeenCalled();
    });
    it("对于terminate是如此", function() {
      var obj = countDown.terminate();
      expect(obj).toBeUndefined();
    });
  });
  describe("开始倒计时之后(调用start之后)", function() {
    var countDownStarted, timerSpy;
    beforeEach(function() {
      jasmine.clock().install();
      countDownStarted = ECar.countDown(10 * 1000);
      countDownStarted.start();
      timerSpy = jasmine.createSpy("timerSpy");
    });
    afterEach(function() {
      countDownStarted.terminate(false);
      jasmine.clock().uninstall();
    });
    it("试图增加every行为是无效的", function() {
      countDownStarted.every(1000, timerSpy);
      jasmine.clock().tick(2000);
      expect(timerSpy).not.toHaveBeenCalled();
    });
    it("试图增加done行为是无效的", function() {
      countDownStarted.done(timerSpy);
      jasmine.clock().tick(10 * 1000 + 1);
      expect(timerSpy).not.toHaveBeenCalled();
    });
    describe("在开始倒计时之前绑定的every", function() {
      var countDown, everySpy, doneSpy;
      beforeEach(function() {
        countDown = ECar.countDown(10 * 1000);
        everySpy = jasmine.createSpy("everySpy");
        countDown.every(1000, everySpy);
        doneSpy = jasmine.createSpy("doneSpy");
        countDown.done(doneSpy);
        jasmine.clock().install();
      });
      afterEach(function() {
        jasmine.clock().uninstall();
      });
      it("每隔指定毫秒数调用一次回调函数", function() {
        countDown.start();
        jasmine.clock().tick(1000 + 1);
        expect(everySpy.calls.count()).toEqual(1);

        jasmine.clock().tick(2000 + 1);
        expect(everySpy.calls.count()).toEqual(3);

        jasmine.clock().tick(5 * 1000 + 1);
        expect(everySpy.calls.count()).toEqual(8);

      });
      it("多次绑定间互不干扰", function() {
        var everySpy2 = jasmine.createSpy("everySpy2"),
          everySpy3 = jasmine.createSpy("everySpy3");
        countDown.every(2 * 1000, everySpy2).every(3 * 1000, everySpy3);
        countDown.start();
        jasmine.clock().tick(1 * 1000 + 1);
        expect(everySpy.calls.count()).toEqual(1);
        expect(everySpy).toHaveBeenCalledWith(9000);
        expect(everySpy2.calls.count()).toEqual(0);
        expect(everySpy3.calls.count()).toEqual(0);

        jasmine.clock().tick(1 * 1000 + 1);
        expect(everySpy.calls.count()).toEqual(2);
        expect(everySpy.calls.argsFor(0)).toEqual([9000]);
        expect(everySpy.calls.argsFor(1)).toEqual([8000]);
        expect(everySpy2.calls.count()).toEqual(1);
        expect(everySpy2.calls.argsFor(0)).toEqual([8000]);
        expect(everySpy3.calls.count()).toEqual(0);

        jasmine.clock().tick(4 * 1000 + 1);
        expect(everySpy.calls.count()).toEqual(6);
        expect(everySpy.calls.argsFor(5)).toEqual([4000]);
        expect(everySpy2.calls.count()).toEqual(3);
        expect(everySpy2.calls.argsFor(2)).toEqual([4000]);
        expect(everySpy3.calls.count()).toEqual(2);
        expect(everySpy3.calls.argsFor(1)).toEqual([4000]);

      });
      it("每隔指定毫秒数调用一次回调函数，可指定回调函数的this", function() {
        var foo0 = {
          bar: function() {}
        };
        var foo1 = {
          bar: function() {}
        };
        spyOn(foo0, "bar");
        spyOn(foo1, "bar");
        countDown.every(1 * 1000, foo0.bar, foo0);
        countDown.every(2 * 1000, foo1.bar, foo1);
        countDown.start();
        jasmine.clock().tick(1 * 1000 + 1);
        expect(foo0.bar.calls.mostRecent()).toEqual({
          object: foo0,
          args: [9000]
        });
        jasmine.clock().tick(1 * 1000);
        expect(foo0.bar.calls.mostRecent()).toEqual({
          object: foo0,
          args: [8000]
        });
        expect(foo1.bar.calls.mostRecent()).toEqual({
          object: foo1,
          args: [8000]
        });
      });
      it("测试edge case, 比如倒计时10*1000，每隔1000毫秒执行一次，最终应该调用9次，而不是10次", function(){
        var countDown = new ECar.countDown(10*1000);
        var everySpy1 = jasmine.createSpy("everySpy1");
        countDown.every(1000, everySpy1);
        var everySpy2 = jasmine.createSpy("everySpy2");
        countDown.every(1000, everySpy2);
        countDown.start();

        jasmine.clock().tick(10*1000+1);
        expect(everySpy1.calls.count()).toEqual(9);
        expect(everySpy2.calls.count()).toEqual(9);

      });
    });
    describe("在开始倒计时之前绑定的done", function() {
      var countDown, doneSpy, beset;
      beforeEach(function() {
        countDown = new ECar.countDown(10 * 1000);
        doneSpy = jasmine.createSpy("doneSpy");
        countDown.done(doneSpy);
        jasmine.clock().install();
      });
      afterEach(function() {
        jasmine.clock().uninstall();
      });
      it("在倒计时结束之后执行一次done回调函数", function() {
        countDown.start();
        jasmine.clock().tick(10 * 1000 + 1);
        expect(doneSpy).toHaveBeenCalled();
        expect(doneSpy.calls.count()).toEqual(1);

        jasmine.clock().tick(10 * 1000 + 1);
        expect(doneSpy).toHaveBeenCalled();
        expect(doneSpy.calls.count()).toEqual(1);
      });
      it("在倒计时结束之后依次执行done回调函数", function() {
        var doneSpy2 = jasmine.createSpy("doneSpy2").and.callFake(function() {
          beset = "doneSpy2";
        });
        countDown.done(doneSpy2);

        var doneSpy3 = jasmine.createSpy("doneSpy3").and.callFake(function() {
          beset = "doneSpy3";
        });
        countDown.done(doneSpy3);
        countDown.start();

        jasmine.clock().tick(10 * 1000 + 1);
        expect(doneSpy2.calls.count()).toEqual(1);
        expect(doneSpy3.calls.count()).toEqual(1);
        expect(beset).toEqual("doneSpy3");
      });
      it("可以指定done回调函数的this参数", function() {
        var foo = {
          bar: function() {}
        };
        spyOn(foo, "bar");
        countDown.done(foo.bar, foo).start();
        jasmine.clock().tick(10 * 1000 + 1);
        expect(foo.bar.calls.mostRecent()).toEqual({
          object: foo,
          args: []
        });
      });
    });
    describe("可以人为停止倒计时", function() {
      var countDownStarted, everySpy, doneSpy;
      // 注意：利用beforeEach和afterEach逐层调用的特点，可以取出一些冗余代码
      beforeEach(function() {
        countDownStarted = ECar.countDown(10 * 1000);
        jasmine.clock().install();
        everySpy = jasmine.createSpy("everySpy");
        countDownStarted.every(1000, everySpy);
        doneSpy = jasmine.createSpy("doneSpy");
        countDownStarted.done(doneSpy);
        countDownStarted.start();
        countDownStarted.terminate(false);
      });
      afterEach(function() {
        jasmine.clock().uninstall();
      });
      it("终止后，every绑定function不再执行", function() {
        jasmine.clock().tick(1001);
        expect(everySpy).not.toHaveBeenCalled();

        jasmine.clock().tick(2001);
        expect(everySpy).not.toHaveBeenCalled();

        jasmine.clock().tick(10 * 1000 + 1);
        expect(everySpy).not.toHaveBeenCalled();
      });
      it("终止后，done绑定function不再执行", function() {
        jasmine.clock().tick(10 * 1000 + 1);
        expect(doneSpy).not.toHaveBeenCalled();
      });
      it("终止后，再调用terminate无效", function() {
        expect(countDownStarted.terminate(false)).toBeUndefined();
      });
      it("终止后，再调用start无效", function() {
        expect(countDownStarted.start()).toBeUndefined();
      });
    });
  });
  describe("在倒计时结束之后", function() {
    var doneSpy, everySpy, everySpy2, countDown;
    beforeEach(function() {
      jasmine.clock().install();
      countDown = ECar.countDown(10*1000);

      everySpy = jasmine.createSpy("everySpy");
      countDown.every(1 * 1000, everySpy);

      doneSpy = jasmine.createSpy("doneSpy");
      countDown.done(doneSpy);

      everySpy2 = jasmine.createSpy("everySpy2");
      countDown.every(1*1000, everySpy2);

      countDown.start();
    });
    afterEach(function() {
      jasmine.clock().uninstall();
      countDown.terminate(false);
      countDown = null;
    });
    it("every绑定function不再执行", function() {
      jasmine.clock().tick(5*1000+1);
      expect(everySpy.calls.count()).toEqual(5);
      expect(everySpy2.calls.count()).toEqual(5);
      jasmine.clock().tick(5*1000);
      expect(everySpy.calls.count()).toEqual(9);
      expect(everySpy2.calls.count()).toEqual(9);
      jasmine.clock().tick(5*1000+1);
      expect(everySpy.calls.count()).toEqual(9);
      expect(everySpy2.calls.count()).toEqual(9);
    });
    it("done绑定function不再执行", function() {
      jasmine.clock().tick(10*1000+1);
      expect(doneSpy.calls.count()).toEqual(1);
      jasmine.clock().tick(10*1000+1);
      expect(doneSpy.calls.count()).toEqual(1);
    });
    it("再调用terminate无效", function() {
      jasmine.clock().tick(10*1000+1);
      expect(countDown.terminate()).toBeUndefined();
    });
    it("再调用start无效", function() {
      jasmine.clock().tick(10*1000+1);
      expect(countDown.start()).toBeUndefined();
    });
  });
});