const {cache_update_timeout} = require('../configuration/config')
const logger = require('./logger')

const getUser = (cache, key) => {
    const user = cache.get(key);

}

class CacheManager {
    constructor(maxSize = 5) {
        this.cacheMap = {};
        this.order = [];
        this.maxSize = maxSize;

        setInterval(() => {
            this.clear();
            logger.info('CacheManager cache cleared');
        }, cache_update_timeout * 1000);
    }

    set(key, value) {
        if (this.cacheMap[key]) {
            const index = this.order.indexOf(key);
            if (index > -1) {
                this.order.splice(index, 1);
            }
        }

        if (this.order.length >= this.maxSize) {
            const oldestKey = this.order.shift();
            delete this.cacheMap[oldestKey];
        }

        this.order.push(key);
        this.cacheMap[key] = { value };
    }

    get(key) {
        const cacheItem = this.cacheMap[key];
        return cacheItem ? cacheItem.value : null;
    }

    delete(key) {
        delete this.cacheMap[key];
        const index = this.order.indexOf(key);
        if (index > -1) {
            this.order.splice(index, 1);
        }
    }

    clear() {
        this.cacheMap = {};
        this.order = [];
    }

    setMaxSize(newSize) {
        this.maxSize = newSize;
        while (this.order.length > this.maxSize) {
            const oldestKey = this.order.shift();
            delete this.cacheMap[oldestKey];
        }
    }

    keys() {
        return this.order.slice();
    }
}

module.exports = CacheManager;
