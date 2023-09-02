<template>
    <el-table :data="JSON.parse(props.tableData)" stripe style="width: 100%;margin-top: 20px;">
        <el-table-column prop="name" label="键名" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="describe" label="说明" />
        <el-table-column prop="isRequire" label="必传" />
    </el-table>
</template>
  
<script setup>

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