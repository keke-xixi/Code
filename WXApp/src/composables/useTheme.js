import { ref, computed } from 'vue'
import { THEMES, themeToCssVars } from '@/config/theme.js'
import { getUser } from '@/utils/request.js'

const themeId = ref('blue')

function applyNavBar(theme) {
  uni.setNavigationBarColor({
    frontColor: '#000000',
    backgroundColor: theme.navBg,
    animation: { duration: 200, timingFunc: 'easeIn' },
  })
}

function resolveThemeId(id) {
  return THEMES[id] ? id : 'blue'
}

export function useTheme() {
  const theme = computed(() => THEMES[themeId.value] || THEMES.blue)
  const themeStyle = computed(() => themeToCssVars(theme.value))
  const themeList = computed(() => Object.values(THEMES))

  const applyTheme = (id) => {
    const tid = resolveThemeId(id)
    themeId.value = tid
    applyNavBar(THEMES[tid])
  }

  const syncThemeFromUser = (user) => {
    const u = user || getUser()
    applyTheme(u?.theme || 'blue')
  }

  const initTheme = () => {
    syncThemeFromUser()
  }

  return {
    themeId,
    theme,
    themeStyle,
    themeList,
    applyTheme,
    syncThemeFromUser,
    initTheme,
  }
}

export function getThemeId() {
  return themeId.value
}
