<template>
  <div>
    <!-- Friend list content goes here -->
    <ul>
      <li>FriendOne</li>
      <li>FriendTwo</li>
      <li v-for="friend in friends" :key="friend.id">
        {{ friend.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Friend {
  id: number
  name: string
}

const friends = ref<Friend[]>([])

// You can add your component logic here
</script>