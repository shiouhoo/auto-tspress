<template>
    <el-table :data="props.tableData" stripe style="width: 100%;margin-top: 20px;">
        <el-table-column prop="name" label="键名" fixed="left" width="100" />
        <el-table-column prop="type" label="类型" :width="isTypeMoreLong ?'200':'100'"/>
        <el-table-column prop="describe" label="说明" :width="isDescribeMoreLong ?'300':'200'"/>
        <el-table-column prop="isRequire" label="必传" />
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
    }
})
const isTypeMoreLong = computed(()=>{
    return !!props.tableData.some((item)=>{
        return item.type.length > 10;
    })
})
const isDescribeMoreLong = computed(()=>{
    return !!props.tableData.some((item)=>{
        return item.describe.length > 10;
    })
})
</script>
<style>

</style>