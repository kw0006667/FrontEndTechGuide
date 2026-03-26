export default {
  title: '實作經典前端工具函式',
  intro: '能夠從零實作常用的工具函式，是檢驗工程師對 JavaScript 語言理解深度的最佳方式。本章從「直覺版」逐步演化為「production 版」，讓你看見每個 edge case 背後的思考過程。',
  content: `
<section id="debounce-throttle">
  <h2>debounce 與 throttle 完整實作</h2>

  <h3>debounce：延遲執行，連續觸發只執行最後一次</h3>
  <pre data-lang="javascript"><code class="language-javascript">function debounce(fn, delay, options = {}) {
  const { leading = false, trailing = true } = options;
  let timer = null;
  let lastResult;

  function debounced(...args) {
    const callLeading = leading && !timer;

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (trailing && !callLeading) {
        lastResult = fn.apply(this, args);
      }
    }, delay);

    if (callLeading) {
      lastResult = fn.apply(this, args);
    }

    return lastResult;
  }

  // 提供取消機制
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  debounced.flush = function(...args) {
    clearTimeout(timer);
    timer = null;
    return fn.apply(this, args);
  };

  return debounced;
}

// 使用：
const debouncedSearch = debounce(searchAPI, 300, { leading: false, trailing: true });
input.addEventListener('input', debouncedSearch);

// 元件銷毀時清除
disconnectedCallback() {
  debouncedSearch.cancel();
}</code></pre>

  <h3>throttle：限制執行頻率，固定時間內最多執行一次</h3>
  <pre data-lang="javascript"><code class="language-javascript">function throttle(fn, interval) {
  let lastTime = 0;
  let timer = null;

  function throttled(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      lastTime = now;
      return fn.apply(this, args);
    }

    // 確保最後一次呼叫也會被執行
    clearTimeout(timer);
    timer = setTimeout(() => {
      lastTime = Date.now();
      timer = null;
      fn.apply(this, args);
    }, remaining);
  }

  throttled.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  return throttled;
}</code></pre>
</section>

<section id="promise-implementations">
  <h2>Promise.all、race、allSettled 實作</h2>
  <pre data-lang="javascript"><code class="language-javascript">// Promise.all 實作
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) return resolve([]);

    const results = new Array(promises.length);
    let remaining = promises.length;

    promises.forEach((promise, i) => {
      Promise.resolve(promise).then(
        (value) => {
          results[i] = value;
          if (--remaining === 0) resolve(results);
        },
        reject  // 任一失敗立即 reject
      );
    });
  });
}

// Promise.allSettled 實作
function promiseAllSettled(promises) {
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p).then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )
    )
  );
}

// Promise.race 實作
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(p => Promise.resolve(p).then(resolve, reject));
  });
}</code></pre>
</section>

<section id="array-polyfills">
  <h2>Array 方法 Polyfill</h2>
  <pre data-lang="javascript"><code class="language-javascript">// Array.prototype.map（處理 sparse array 和 callback mutation）
Array.prototype.myMap = function(callback, thisArg) {
  if (this == null) throw new TypeError('this is null or not defined');
  if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

  const O = Object(this);
  const len = O.length >>> 0;
  const result = new Array(len);

  for (let i = 0; i < len; i++) {
    if (i in O) {  // 跳過 sparse array 的空位
      // 注意：此時 O.length 可能已被 callback 修改，但我們使用 len 快照
      result[i] = callback.call(thisArg, O[i], i, O);
    }
  }
  return result;
};

// Array.prototype.reduce（處理空陣列和初始值）
Array.prototype.myReduce = function(callback, initialValue) {
  const O = Object(this);
  const len = O.length >>> 0;
  let accumulator;
  let startIndex;

  if (arguments.length >= 2) {
    accumulator = initialValue;
    startIndex = 0;
  } else {
    // 找第一個非空位的元素
    let k = 0;
    while (k < len && !(k in O)) k++;
    if (k >= len) throw new TypeError('Reduce of empty array with no initial value');
    accumulator = O[k];
    startIndex = k + 1;
  }

  for (let i = startIndex; i < len; i++) {
    if (i in O) {
      accumulator = callback(accumulator, O[i], i, O);
    }
  }
  return accumulator;
};</code></pre>
</section>

<section id="deep-clone">
  <h2>deepClone 的正確實作</h2>
  <p>一個真正 production-grade 的 deep clone 需要處理 circular reference、Date、RegExp、Map、Set、Symbol keys 等 edge case。</p>
  <pre data-lang="javascript"><code class="language-javascript">function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  // 特殊物件型別
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Error) return Object.assign(new Error(value.message), value);

  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    for (const [k, v] of value) {
      clone.set(deepClone(k, seen), deepClone(v, seen));
    }
    return clone;
  }

  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    for (const v of value) clone.add(deepClone(v, seen));
    return clone;
  }

  // Array / Object（含 Symbol keys）
  const proto = Object.getPrototypeOf(value);
  const clone = Array.isArray(value) ? [] : Object.create(proto);
  seen.set(value, clone);

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor.get || descriptor.set) {
      Object.defineProperty(clone, key, descriptor);
    } else {
      clone[key] = deepClone(value[key], seen);
    }
  }
  return clone;
}</code></pre>
</section>

<section id="curry-flatten">
  <h2>curry 與 flatten</h2>
  <pre data-lang="javascript"><code class="language-javascript">// curry：將多參數函式轉為一系列單參數函式
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);   // 6
add(1, 2)(3);   // 6
add(1)(2, 3);   // 6

// flatten：遞迴展平陣列
function flatten(arr, depth = Infinity) {
  if (depth === 0) return arr.slice();
  return arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...flatten(val, depth - 1));
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
}</code></pre>
</section>

<section id="event-emitter">
  <h2>EventEmitter 實作</h2>
  <pre data-lang="javascript"><code class="language-javascript">class EventEmitter {
  #events = new Map();

  on(event, listener) {
    if (!this.#events.has(event)) {
      this.#events.set(event, new Set());
    }
    this.#events.get(event).add(listener);
    return () => this.off(event, listener); // 返回取消訂閱函式
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    wrapper._original = listener;
    return this.on(event, wrapper);
  }

  off(event, listener) {
    const listeners = this.#events.get(event);
    if (!listeners) return;
    // 支援移除 once 包裝的 listener
    for (const l of listeners) {
      if (l === listener || l._original === listener) {
        listeners.delete(l);
        break;
      }
    }
    if (listeners.size === 0) this.#events.delete(event);
  }

  emit(event, ...args) {
    const listeners = this.#events.get(event);
    if (!listeners) return false;
    // 複製一份，防止 emit 過程中修改 listeners
    for (const listener of [...listeners]) {
      try {
        listener(...args);
      } catch (e) {
        console.error('EventEmitter listener error:', e);
      }
    }
    return true;
  }

  removeAllListeners(event) {
    if (event) {
      this.#events.delete(event);
    } else {
      this.#events.clear();
    }
  }
}</code></pre>
</section>
  `,
};
