<template>
  <div class="emoji-picker-wrapper">
    <div ref="pickerContainer"></div>
    <div v-if="loading" class="loading-overlay">
      <q-spinner size="3em" />
      <div class="q-mt-md">Carregando emojis...</div>
    </div>
    <div v-if="error" class="text-negative q-pa-md">
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmojiPicker',

  data () {
    return {
      picker: null,
      loading: true,
      error: null
    }
  },

  computed: {
    isDark () {
      return this.$q.dark.isActive
    }
  },

  watch: {
    isDark (newVal) {
      if (this.picker) {
        this.picker.classList.remove('dark', 'light')
        this.picker.classList.add(newVal ? 'dark' : 'light')
      }
    }
  },
  async mounted () {
    await this.initPicker()
  },
  beforeDestroy () {
    if (this.picker) {
      this.picker.removeEventListener('emoji-click', this.onEmojiClick)
    }
  },
  methods: {
    async initPicker () {
      try {
        await this.$nextTick()

        await import('emoji-picker-element')

        const dataSource =
          'https://cdn.jsdelivr.net/npm/emoji-picker-element-data@latest/pt/cldr/data.json'

        this.picker = document.createElement('emoji-picker')

        this.picker.dataSource = dataSource
        this.picker.classList.add(this.isDark ? 'dark' : 'light')

        this.picker.addEventListener('emoji-click', this.onEmojiClick)

        this.$refs.pickerContainer.appendChild(this.picker)

        this.loading = false
      } catch (error) {
        console.error('Erro ao carregar picker:', error)
        this.error = error.message
        this.loading = false
      }
    },
    onEmojiClick (event) {
      const emojiData = {
        data: event.detail.unicode,
        emoji: event.detail.emoji,
        unicode: event.detail.unicode
      }

      this.$emit('select', emojiData)
    }
  }
}
</script>

<style scoped>
.emoji-picker-wrapper {
  position: relative;
  width: 350px;
  height: 400px;
  overflow: hidden;
}

.emoji-picker-wrapper >>> emoji-picker {
  width: 100%;
  height: 100%;
  border: none;
  --num-columns: 8;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--q-color-background);
  z-index: 10;
}
</style>
