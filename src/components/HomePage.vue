<template>
  <div class="page-content" @mousedown="startNodesBus($event)" @mousemove="moveNodesBus($event)" @mouseup="endNodesBus($event)">
    <div class="tapBar">
      <div :class="item.sel ? 'tapEachSel ': 'tapEach'"  @click="selStep(i)" v-for="(item , i) in tap" :key="i">{{ item.name }}</div>
    </div>
    <div class="mainContent">
      <div class="nav">
        <div>↓↓↓拖动节点至右边↓↓↓</div>
        <div class="nodes_bus">
          <span @mousedown="dragIt('Constant')">这是一个常量</span>
          <span @mousedown="dragIt('Function')">这是一个函数</span>
        </div>
      </div>
      <div class="DAG-content">
        <!-- <Step1 v-if="tap[0].sel"/>
        <Step2 v-if="tap[1].sel"/>
        <Step3 v-if="tap[2].sel"/>
        <Step4 v-if="tap[3].sel"/>
        <Step5 v-if="tap[4].sel"/>
        <Step6 v-if="tap[5].sel"/>
        <Step7 v-if="tap[6].sel"/> -->
        <Step8 v-if="tap[7].sel"/>
      </div>
    </div>
    <nodes-bus v-if="dragBus" :value="busValue.value" :pos_x="busValue.pos_x" :pos_y="busValue.pos_y" />
    <div class="add">
      <div>
        <input type="text" placeholder="请输入图的名称" v-model="dag.DAG_info.name">
        <input type="text" placeholder="创建人" v-model="dag.DAG_info.creator">
      </div>
      <button>创建</button>
      <button @click="update">更新</button>
    </div>
  </div>
</template>

<script>
import { tap } from "./DataMainPage.js";
import Step from "./STEP";
import NodesBus from "./nodesBus";
import { mapActions, mapState } from "vuex";
export default {
  data() {
    return {
      tap: tap,
      dragBus: false,
      busValue: {
        value: "name",
        pos_x: 100,
        pos_y: 100
      },
      dag: {
        DAG_info:{
          name: '',
          create_time: '',
          update_time: '',
          creator: ''
        },  // 图的元信息
        node_list: [],  // 算子列表
        node_relation: [],  // 算子关系字典
        node_details: {} // 算子详细信息
      }
    };
  },
  computed: {
    ...mapState({
      nodes: state=>state.dagStore.DataAll.nodes,
      edges: state=>state.dagStore.DataAll.edges
    })
    // dag(){
    //   return {
    //     DAG_info:{
    //       name: '',
    //       create_time: '',
    //       update_time: '',
    //       creator: ''
    //     },  // 图的元信息
    //     node_list: [],  // 算子列表
    //     node_relation: []  // 算子关系字典
    //   }
    // }
  },
  watch: {
    dag: {
      deep: true,
      handler(val){
         console.log('val...', val);
      }
    }
  },
  methods: {
    update(){
      console.log('nodes...edges...', this.nodes, this.edges)
      // 组装算子列表
      this.dag.node_list = this.nodes.map(item=>item.id);
      this.nodes.forEach(item=>{
        this.dag.node_details[item.id] = {
          name: item.name,
          display_name: item.name,
          coordinate: {
            x: item.pos_x,
            y: item.pos_y
          },
          params: item
        };
      })
      // 组装算子关系
      this.edges.forEach(item=>{
        let {dst_node_id} = item;
        if (this.dag.node_relation[dst_node_id] && this.dag.node_relation[dst_node_id].length){
            this.dag.node_relation[dst_node_id].push({
            source: item.src_node_id,
            source_index: item.src_output_idx,
            target_index: item.dst_input_idx
          })
        }else{
          this.dag.node_relation[dst_node_id] = [{
            source: item.src_node_id,
            source_index: item.src_output_idx,
            target_index: item.dst_input_idx
          }]
        }
      })
      console.log('this.dag...', this.dag);
    },
    ...mapActions(["addNode", "addEdge"]),
    selStep(i) {
      window.sessionStorage["step"] = i;
      this.tap.forEach((item, n) => {
        i - n === 0 ? (item.sel = true) : (item.sel = false);
      });
      this.tap = JSON.parse(JSON.stringify(this.tap));
    },
    dragIt(val) {
      sessionStorage["dragDes"] = JSON.stringify({
        drag: true,
        name: val
      });
    },
    startNodesBus(e) {
      /**
       *  别的组件调用时, 先放入缓存
       * dragDes: {
       *    drag: true,
       *    name: 组件名称
       *    type: 组件类型
       *    model_id: 跟后台交互使用
       * }
       **/
      let dragDes = null;
      if (sessionStorage["dragDes"]) {
        dragDes = JSON.parse(sessionStorage["dragDes"]);
      }
      if (dragDes && dragDes.drag) {
        const x = e.pageX;
        const y = e.pageY;
        this.busValue = Object.assign({}, this.busValue, {
          pos_x: x,
          pos_y: y,
          value: dragDes.name
        });
        this.dragBus = true;
      }
    },
    moveNodesBus(e) {
      if (this.dragBus) {
        const x = e.pageX;
        const y = e.pageY;
        this.busValue = Object.assign({}, this.busValue, {
          pos_x: x,
          pos_y: y
        });
      }
    },
    endNodesBus(e) {
      let dragDes = null;
      if (sessionStorage["dragDes"]) {
        dragDes = JSON.parse(sessionStorage["dragDes"]);
      }
      // console.log('e...', e);
      if (dragDes && dragDes.drag && e.toElement.id === "svgContent") {
        const { model_id, type } = dragDes;
        const pos_x =
          (e.offsetX - 90 - (sessionStorage["svg_left"] || 0)) /
          (sessionStorage["svgScale"] || 1); // 参数修正
        const pos_y =
          (e.offsetY - 15 - (sessionStorage["svg_top"] || 0)) /
          (sessionStorage["svgScale"] || 1); // 参数修正
        const params = {
          model_id: sessionStorage["newGraph"],
          desp: {
            type,
            pos_x,
            pos_y,
            name: this.busValue.value
          }
        };
        this.addNode(params);
      }
      window.sessionStorage["dragDes"] = null;
      this.dragBus = false;
    }
  },
  mounted() {
    if (window.sessionStorage["step"]) {
      const i = window.sessionStorage.step;
      this.selStep(i);
    }
    sessionStorage["svgScale"] = 1;
    // 获取数据，画图
    fetch('/api/data').then(res=>res.json()).then(res=>{
      console.log('res...', res);
      // 处理节点
      for (let key in res.node_details){
         this.addNode({
          desp: {
            id: key,
            name: res.node_details[key].name,
            display_name: res.node_details[key].display_name,
            pos_x: res.node_details[key].coordinate.x,
            pos_y:res.node_details[key].coordinate.y
          }
        })
      }
      // 处理边
      for (let key in res.node_relations){
        res.node_relations[key].forEach(item=>{
          // 添加边
          this.addEdge({
            desp: {
              dst_input_idx: item.target_index,
              dst_node_id: key,
              src_node_id: item.source,
              src_output_idx: item.source_index
            }
          })
        })
      }
    })
  },
  components: {
    ...Step,
    NodesBus
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.page-content {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
.tapBar {
  width: 100%;
  height: 60px;
  background-color: #212528;
  display: flex;
  padding-top: 10px;
  padding-left: 300px;
}
.tapEach {
  height: 50px;
  line-height: 50px;
  text-align: center;
  width: 100px;
  color: #ffffff;
  cursor: pointer; 
  margin:0 5px ;
}
.tapEachSel {
  height: 50px;
  line-height: 50px;
  text-align: center;
  width: 100px;
  color: #212528;
  background: #cccccc;
  cursor: pointer;
  box-sizing: border-box;
  margin:0 10px;
}
.mainContent {
  width: 100%;
  position: absolute;
  left: 0;
  top: 70px;
  bottom: 0;
  text-align: left;

}
.mainContent .nav {
  width: 300px;
  background: #212528;
  position: absolute;
  left: 0;
  bottom: 0;
  top: 0;
}
.mainContent .nav div {
  color: #ffffff;
  height: 50px;
  line-height: 50px;
  width: 100%;
  text-align: center;
}
.DAG-content {
  position: absolute;
  left: 300px;
  top: 0;
  bottom: 0;
  right: 0;
}
#svgContent{
  width: 100%;
  height: 100%;
}
.nodes_bus {
  user-select: none;
  text-align: center;
}
.nodes_bus span {
  display: block;
  border: 1px white solid;
  height: 50px;
  width: 200px;
  margin-left: 50%;
  transform: translateX(-50%);
  margin-bottom: 30px;
  cursor: move;
  border-radius: 50px;
}
.add{
  width: 300px;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  border-left: 1px solid #ccc;
}
.add div{
  width: 80%;
  margin:0 10%;
}
.add div>input{
  height: 45px;
  margin:8px 0;
}
.add button{
  width: 80%;
  height: 45px;
  margin: 0 10%;
}
</style>
