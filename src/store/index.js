import Vue from 'vue';
import Vuex from 'vuex';
import dagStore from './modules/dagStore';
import Logger from 'vuex/dist/logger'
Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        dagStore
    },
    plugins: [Logger()]
});

export default store;
