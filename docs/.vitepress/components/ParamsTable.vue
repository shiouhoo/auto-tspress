<template>
    <el-table :data="JSON.parse(props.tableData)" stripe style="width: 100%;margin-top: 20px;">
        <el-table-column prop="name" label="参数名" fixed="left" width="100"/>
        <el-table-column prop="type" label="类型" :width="isTypeMoreLong ?'200':'100'"/>
        <el-table-column prop="describe" label="说明"  :width="isDescribeMoreLong ?'300':'200'"/>
        <el-table-column prop="isRequire" label="必传" width="80"/>
        <el-table-column prop="default" label="默认值" />
    </el-table>
</template>
  
<script setup>
import {computed} from 'vue'

// {
//     name: string,
//     describe: string,
//     type: string,
//     isRequire: string,
//     default: string,
// }[]
const props = defineProps({
    tableData: {
        type: String,
        default:()=>{
            return '[]'
        }
    }
})
const isTypeMoreLong = computed(()=>{
    const data = JSON.parse(props.tableData);
    return !!data.some((item)=>{
        return item.type.length > 10;
    })
})
const isDescribeMoreLong = computed(()=>{
    const data = JSON.parse(props.tableData);
    return !!data.some((item)=>{
        return item.describe.length > 10;
    })
})
</script>
<style>

</style>