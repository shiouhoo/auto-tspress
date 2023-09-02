<template>
    <el-table :data="JSON.parse(props.tableData)" stripe style="width: 100%;margin-top: 20px;">
        <el-table-column prop="name" label="参数名" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="describe" label="说明" />
        <el-table-column prop="isRequire" label="必传" />
        <el-table-column prop="default" label="默认值" />
    </el-table>
</template>
  
<script setup>

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
</script>
<style>

</style>