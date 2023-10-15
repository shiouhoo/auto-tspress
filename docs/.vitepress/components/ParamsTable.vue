<template>
    <el-table :data="props.tableData" stripe border style="width: 100%;margin: 20px 0;">
        <el-table-column prop="name" label="参数名" fixed="left" width="140"/>
        <el-table-column prop="type" label="类型" :width="typeWidth">
            <template #default="scope">
                <a :href="scope.row.typeTarget" v-show="scope.row.typeTarget">{{ scope.row.type }}</a>
                <span v-show="!scope.row.typeTarget">{{ scope.row.type }}</span>
            </template>
        </el-table-column>
        <el-table-column prop="describe" label="说明"  :width="describeWidth"/>
        <el-table-column prop="isRequire" label="必传" width="80"/>
        <el-table-column prop="defaultValue" label="默认值" :width="defaultWidth"/>
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
//     typeTarget: string
// }[]
const props = defineProps({
    tableData: {
        type: Array,
        default:()=>{
            return []
        }
    }
})

const typeWidth = computed(()=>{
    return !!props.tableData.some((item)=>{
        return item.type.length > 10;
    }) ? 200: '';
})

const describeWidth = computed(()=>{
    return !!props.tableData.some((item)=>{
        return item.describe.length > 20;
    }) ? 250: '';
})

const defaultWidth = computed(()=>{
    return !!props.tableData.some((item)=>{
        return item.defaultValue?.length > 20;
    }) ? 250 : 100;
})
</script>
<style>

</style>