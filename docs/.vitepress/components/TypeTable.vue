<template>
    <el-table :data="props.tableData" stripe border style="width: 100%;margin-top: 20px;">
        <el-table-column prop="name" label="键名" fixed="left" width="150" >
            <template #default="scope">
                <span>{{  scope.row.name }}</span>
                <el-tag style="margin-left: 5px;" v-if="scope.row.isIndexSignature">索引签名</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="type" :label="getLabel" :width="typeWidth">
            <template #default="scope">
                <span v-html="scope.row.type" ></span>
            </template>
        </el-table-column>
        <el-table-column prop="describe" label="说明" />
        <el-table-column prop="isRequire" label="必传" width="100"/>
    </el-table>
</template>
  
<script setup>
import {computed} from 'vue'

const props = defineProps({
    tableData: {
        type: Array,
        default:()=>{
            return []
        }
    },
    type: {
        type: String,
        default: 'interface'
    }
})
const typeWidth = computed(()=>{
    return !!props.tableData.some((item)=>{
        const dom = document.createElement('div');
        dom.innerHTML = item.type;
        return dom?.textContent?.length > 20;
    }) ? 300: '';
})

const getLabel = computed(()=>{
    if(props.type === 'interface'){
        return '类型';
    }else if(props.type === 'enum'){
        return '枚举值'
    }else if(props.type === 'type'){
        return '类型'
    }
    return '';
})
</script>
<style>

</style>