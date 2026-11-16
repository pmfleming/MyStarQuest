const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      'assets/esm-CeRk7Jmz.js',
      'assets/vendor-react-CSNvSZ3l.js',
      'assets/rolldown-runtime-hePW80VL.js',
      'assets/dist-Cko5KDEy.js',
      'assets/schoolCalendarStore-CtVtqFha.js',
      'assets/vendor-validation-BHbdVpNU.js',
      'assets/withDeadline-DLXdhW9j.js',
      'assets/web-Dp9rlSDj.js',
      'assets/index.esm-CgWa2-kS.js',
      'assets/index.esm-DZBymQOC.js',
      'assets/DashboardPage-HSmbkqk7.js',
      'assets/tokens-DU0l72ka.js',
      'assets/heart-BMsit08A.js',
      'assets/assetCatalog-D2sWnrdd.js',
      'assets/today-Br7GpS5e.js',
      'assets/useTaskCelebration-Bd7Z03Zo.js',
      'assets/ActionArtwork-BlFRIRih.js',
      'assets/ActionArtwork-CegxjQLZ.css',
      'assets/keyboardActivation-IjNOuAFz.js',
      'assets/AsyncButton-BvE1ZVLR.js',
      'assets/ImageStarFrame-ChzV8AnX.js',
      'assets/themeActionAssets-zHShQQxz.js',
      'assets/stepperLayout-DFALQKcB.js',
      'assets/types-C7mZ3rSI.js',
      'assets/TabContent-BVu2rzx9.js',
      'assets/runtime-CP8Za6-8.js',
      'assets/api-q8xwMakM.js',
      'assets/useUserDocumentUpdates-vAmQVfoK.js',
      'assets/TabContent-B3n38PW_.css',
      'assets/assets-D9f3H4hJ.js',
      'assets/RewardCelebration-CfjajenS.js',
      'assets/RewardCelebration-BdxECCER.css',
      'assets/seasonAssets-DlhtVsuK.js',
      'assets/useChildren-B8gsY8g4.js',
      'assets/useRequiredContext-9gyUtkvU.js',
      'assets/themeOptions-DzadAVIG.js',
      'assets/Carousel-DjKCymbR.js',
      'assets/InlineNotice-_yPbeCpZ.js',
      'assets/TestsPage-C28IvfIK.js',
      'assets/tabNavigation-C7O5RbQh.js',
      'assets/SegmentedChoiceControl-CTKBQIPc.js',
      'assets/memo-B1WbUyUE.js',
      'assets/useAsyncFeedback-CBUcEWZ1.js',
      'assets/RewardsPage-BeHrOEUz.js',
      'assets/assets-Ee-t4kf9.js',
      'assets/spellingAssets-e5DqSSH6.js',
      'assets/animalAssets-DSjLmpml.js',
      'assets/useDismissibleLayer-I5UX3qaC.js',
      'assets/definitionRowDescriptors-hOaYsuvK.js',
      'assets/RewardsPage-CwYVeKpE.css',
      'assets/TimeExplorerPage-B-t8aZ5x.js',
      'assets/solar-CBYeHvt_.js',
      'assets/calendarSchedule-DommsM-m.js',
      'assets/TimeExplorerPage-D-e63RH1.css',
      'assets/ManageChildrenPage-DSeSjtmZ.js',
      'assets/schoolEventAssets-BjgJQk02.js',
      'assets/ProtectedDataRoute-RYfVrvbb.js',
      'assets/InvitationPage-DDPwc2Kq.js',
    ])
) => i.map((i) => d[i])
import { n as e, r as t } from './rolldown-runtime-hePW80VL.js'
import {
  a as n,
  c as r,
  d as i,
  f as a,
  i as o,
  l as s,
  m as c,
  n as l,
  o as u,
  r as d,
  s as f,
  t as p,
} from './vendor-react-CSNvSZ3l.js'
import { i as m, t as h } from './dist-Cko5KDEy.js'
import { t as g } from './useRequiredContext-9gyUtkvU.js'
import { o as ee, s as te } from './index.esm-DZBymQOC.js'
import {
  C as ne,
  H as re,
  L as ie,
  S as ae,
  W as oe,
  d as se,
  f as ce,
  i as _,
  k as le,
  u as ue,
} from './index.esm-CgWa2-kS.js'
import {
  a as de,
  g as fe,
  h as pe,
  i as v,
  n as me,
  o as he,
  r as ge,
  t as _e,
} from './tokens-DU0l72ka.js'
import './themeOptions-DzadAVIG.js'
import { _ as ve, y } from './vendor-validation-BHbdVpNU.js'
import { o as ye, r as b, t as be } from './today-Br7GpS5e.js'
import { i as xe, t as Se } from './solar-CBYeHvt_.js'
import {
  a as Ce,
  i as x,
  n as we,
  o as S,
  r as Te,
  t as C,
} from './tabNavigation-C7O5RbQh.js'
import { n as Ee, t as w } from './AsyncButton-BvE1ZVLR.js'
import { t as De } from './ActionArtwork-BlFRIRih.js'
;(function () {
  let e = document.createElement(`link`).relList
  if (e && e.supports && e.supports(`modulepreload`)) return
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e)
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e)
  }).observe(document, { childList: !0, subtree: !0 })
  function t(e) {
    let t = {}
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      (t.credentials =
        e.crossOrigin === `use-credentials`
          ? `include`
          : e.crossOrigin === `anonymous`
            ? `omit`
            : `same-origin`),
      t
    )
  }
  function n(e) {
    if (e.ep) return
    e.ep = !0
    let n = t(e)
    fetch(e.href, n)
  }
})()
var T = t(c(), 1),
  Oe = a()
function ke(e) {
  try {
    let t = new URL(e),
      n = new Set([
        window.location.origin,
        `https://mystarquest-1b6f8.web.app`,
        `https://mystarquest-1b6f8.firebaseapp.com`,
      ])
    return t.protocol !== `https:` ||
      !n.has(t.origin) ||
      !/^\/invite\/[a-f0-9]{64}$/.test(t.pathname) ||
      !/^#[A-Za-z0-9_-]{30,150}$/.test(t.hash)
      ? null
      : t.pathname + t.hash
  } catch {
    return null
  }
}
function Ae() {
  let e = r()
  return (
    (0, T.useEffect)(() => {
      if (!h.isNativePlatform()) return
      let t = !1,
        n,
        r = (n) => {
          let r = ke(n)
          r && !t && e(r)
        }
      return (
        i(
          async () => {
            let { App: e } = await import(`./esm-CeRk7Jmz.js`)
            return { App: e }
          },
          __vite__mapDeps([0, 1, 2, 3])
        ).then(async ({ App: e }) => {
          let i = await e.addListener(`appUrlOpen`, ({ url: e }) => r(e))
          if (t) {
            await i.remove()
            return
          }
          n = () => i.remove()
          let a = await e.getLaunchUrl()
          a && r(a.url)
        }),
        () => {
          ;((t = !0), n?.())
        }
      )
    }, [e]),
    null
  )
}
var E = (0, T.createContext)(void 0),
  D = () => g(E, `useAuth`, `AuthProvider`)
function O(e) {
  let t = !1,
    n,
    r,
    i = () => {
      t || e()
    },
    a = requestAnimationFrame(() => {
      a = requestAnimationFrame(() => {
        typeof window.requestIdleCallback == `function`
          ? (n = window.requestIdleCallback(i, { timeout: 1500 }))
          : (r = setTimeout(i, 0))
      })
    })
  return () => {
    ;((t = !0),
      cancelAnimationFrame(a),
      n !== void 0 && window.cancelIdleCallback(n),
      r !== void 0 && clearTimeout(r))
  }
}
function je() {
  let { user: e } = D(),
    t = !!e
  return (
    (0, T.useEffect)(() => {
      if (!t) return
      let e = !1,
        n,
        r = O(() => {
          i(
            async () => {
              let { schoolCalendarStore: e } = await import(
                `./schoolCalendarStore-CtVtqFha.js`
              ).then((e) => e.n)
              return { schoolCalendarStore: e }
            },
            __vite__mapDeps([4, 2, 3, 5, 6])
          )
            .then(({ schoolCalendarStore: t }) => {
              e || (n = t.start())
            })
            .catch(() => {})
        })
      return () => {
        ;((e = !0), r(), n?.())
      }
    }, [t]),
    null
  )
}
var k
;(function (e) {
  ;((e.IndexedDbLocal = `INDEXED_DB_LOCAL`),
    (e.InMemory = `IN_MEMORY`),
    (e.BrowserLocal = `BROWSER_LOCAL`),
    (e.BrowserSession = `BROWSER_SESSION`))
})((k ||= {}))
var A
;(function (e) {
  ;((e.APPLE = `apple.com`),
    (e.FACEBOOK = `facebook.com`),
    (e.GAME_CENTER = `gc.apple.com`),
    (e.GITHUB = `github.com`),
    (e.GOOGLE = `google.com`),
    (e.MICROSOFT = `microsoft.com`),
    (e.PLAY_GAMES = `playgames.google.com`),
    (e.TWITTER = `twitter.com`),
    (e.YAHOO = `yahoo.com`),
    (e.PASSWORD = `password`),
    (e.PHONE = `phone`))
})((A ||= {}))
var j = m(`FirebaseAuthentication`, {
  web: () =>
    i(
      () =>
        import(`./web-Dp9rlSDj.js`).then(
          (e) => new e.FirebaseAuthenticationWeb()
        ),
      __vite__mapDeps([7, 3, 2, 8, 9])
    ),
})
te(`firebase`, `12.19.0`, `app`)
var Me = e({ app: () => P, auth: () => F }),
  M = {
    apiKey: `AIzaSyC1DxC8dndl1LUggxwQjp81LaIX6w-s6uA`,
    authDomain: `mystarquest-1b6f8.firebaseapp.com`,
    projectId: `mystarquest-1b6f8`,
    storageBucket: `mystarquest-1b6f8.firebasestorage.app`,
    messagingSenderId: `380363336461`,
    appId: `1:380363336461:web:3a6d19ace53ab7d7069e44`,
  },
  N = Object.entries(M)
    .filter(([, e]) => typeof e != `string` || e.trim().length === 0)
    .map(([e]) => e)
if (N.length > 0) throw Error(`Missing Firebase configuration: ${N.join(`, `)}`)
var P = ee(M),
  F = ne(P, { persistence: [ae, ue, ce] }),
  I = `msq:preload-saved-session`
function Ne() {
  try {
    return localStorage.getItem(I) === `1`
  } catch {
    return !1
  }
}
function Pe(e) {
  try {
    e ? localStorage.setItem(I, `1`) : localStorage.removeItem(I)
  } catch {}
}
function L(e) {
  let t = `msq:${e}`
  typeof performance < `u` &&
    typeof performance.mark == `function` &&
    performance.getEntriesByName(t).length === 0 &&
    performance.mark(t)
}
var R = p(),
  Fe = (e) => {
    if (
      typeof e != `object` ||
      !e ||
      !(`credential` in e) ||
      typeof e.credential != `object` ||
      e.credential === null ||
      !(`idToken` in e.credential) ||
      typeof e.credential.idToken != `string` ||
      e.credential.idToken.length === 0
    )
      throw Error(`Google sign-in did not return an ID token.`)
    return e.credential.idToken
  },
  Ie = ({ children: e }) => {
    let [t, n] = (0, T.useState)(null),
      [r, i] = (0, T.useState)(!0)
    ;(0, T.useEffect)(
      () =>
        le(F, (e) => {
          ;(Pe(!!e), L(`auth-ready`), n(e), i(!1))
        }),
      []
    )
    let a = (0, T.useCallback)(async () => {
        if (h.isNativePlatform()) {
          let e = Fe(await j.signInWithGoogle()),
            t = _.credential(e)
          await ie(F, t)
        } else {
          let e = new _()
          await re(F, e, se)
        }
      }, []),
      o = (0, T.useCallback)(async () => {
        ;(h.isNativePlatform() && (await j.signOut()), await oe(F))
      }, []),
      s = (0, T.useMemo)(
        () => ({ user: t, loading: r, loginWithGoogle: a, logout: o }),
        [t, r, a, o]
      )
    return (0, R.jsx)(E.Provider, { value: s, children: e })
  },
  Le = { princess: !0, teenie: !0 },
  z = (e) => typeof e == `string` && Object.hasOwn(Le, e),
  B = {
    teenie: {
      id: `teenie`,
      name: `Teenie Friends`,
      emoji: `💖`,
      fontFamily: `MSQ Nunito`,
      fontHref: `/assets/Nunito-VariableFont_wght-Ce_vFdn6.woff2`,
      colors: {
        bg: `#FFF0F6`,
        surface: `#FFFFFF`,
        text: `#3C2856`,
        primary: `#B53E88`,
        secondary: `#7751C9`,
        accent: `#F2A3D1`,
      },
      fonts: {
        heading: `"MSQ Nunito", var(--app-fallback-font), sans-serif`,
        body: `"MSQ Nunito", var(--app-fallback-font), sans-serif`,
      },
      buttonStyle: `rounded-3xl border-4 border-pink-400 shadow-[4px_4px_0px_#BA4B94]`,
      bgPattern: `none`,
      confetti: [`⭐`, `💖`, `✨`, `🌸`],
      get activityImages() {
        return de()
      },
      get explorerBackgroundImages() {
        return he()
      },
    },
    princess: {
      id: `princess`,
      name: `Royal Kingdom`,
      emoji: `👑`,
      fontFamily: `MSQ Merienda`,
      fontHref: `/assets/Merienda-VariableFont_wght-DXSFDypz.woff2`,
      colors: {
        bg: `#FDF2F8`,
        surface: `#FFFFFF`,
        text: `#831843`,
        primary: `#EC4899`,
        secondary: `#A855F7`,
        accent: `#F9A8D4`,
      },
      fonts: {
        heading: `"MSQ Merienda", var(--app-fallback-font), sans-serif`,
        body: `"MSQ Merienda", var(--app-fallback-font), sans-serif`,
      },
      buttonStyle: `rounded-3xl border-4 border-pink-500 shadow-[4px_4px_0px_#DB2777]`,
      bgPattern: `linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 50%, #FBCFE8 100%)`,
      confetti: [`👑`, `✨`, `💖`, `🌸`],
      activityImages: {
        bedtime: `/assets/bedtime-NsendQdx.svg`,
        eatingBreakfast: fe,
        commute: `/assets/commute-D_euZRbs.svg`,
        schooltime: `/assets/schooltime-D8hjEyqo.svg`,
        tableWork: `/assets/table-work-B9EQ5qra.webp`,
        circleTime: `/assets/circle-time-viGayswG.webp`,
        outdoorPlay: `/assets/outdoor-play-BJIA0m-O.webp`,
        fruitSnack: `/assets/fruit-snack-DvjCjoUb.webp`,
        choiceTime: `/assets/choice-time-DMceOOtF.webp`,
        schoolLunch: `/assets/school-lunch-FDn48jOq.webp`,
        goingHome: `/assets/going-home-5DDqYI2C.webp`,
        playing: `/assets/playing-2G6YlBnR.svg`,
        eatingDinner: pe,
        computergames: `/assets/computergames-CT6zGD1m.svg`,
        bathtime: `/assets/bathtime-DRSbni26.svg`,
        cooking: `/assets/cooking-CGsaiSx7.svg`,
        washingTeeth: `/assets/washing-teeth-DnMCbbM9.svg`,
        ballet: `/assets/ballet-BxqYiIuY.webp`,
        swimming: `/assets/swimming-D0DeLTuJ.webp`,
        judo: `/assets/judo-DpHLYU9H.webp`,
        piano: `/assets/piano-BlorzzXS.webp`,
      },
      explorerBackgroundImages: {
        sunrise: {
          spring: `/assets/spring-sunrise-e0j2IWnv.webp`,
          summer: `/assets/summer-sunrise-BrAgQH90.webp`,
          autumn: `/assets/autumn-sunrise-1vcVqtzR.webp`,
          winter: `/assets/winter-sunrise-Cl7f9OS3.webp`,
        },
        daytime: {
          spring: `/assets/spring-daytime-CXoEHlD5.webp`,
          summer: `/assets/summer-daytime-Dfg986gY.webp`,
          autumn: `/assets/autumn-daytime-BRC6MBqs.webp`,
          winter: `/assets/winter-daytime-UJKlT0ty.webp`,
        },
        sunset: {
          spring: `/assets/spring-sunset-C0q_g8zD.webp`,
          summer: `/assets/summer-sunset-CEpRomNO.webp`,
          autumn: `/assets/autumn-sunset-Dzdt8-9n.webp`,
          winter: `/assets/winter-sunset-Bc8G1G8t.webp`,
        },
        night: {
          spring: `/assets/spring-night-B_p82l4b.webp`,
          summer: `/assets/summer-night-OOO6Q9Yj.webp`,
          autumn: `/assets/autumn-night-D55Xj6vf.webp`,
          winter: `/assets/winter-night-uh_ZuhMy.webp`,
        },
      },
    },
  },
  V = (0, T.createContext)({
    theme: B.princess,
    currentTheme: `princess`,
    setTheme: () => {},
  }),
  H = () => {
    let e = T.useContext(V)
    if (!e) throw Error(`useTheme must be used within a ThemeProvider`)
    return e
  },
  Re = ({ children: e }) => {
    let [t, n] = (0, T.useState)(`princess`)
    ;(0, T.useEffect)(() => {
      let e = B[t] || B.princess
      typeof document < `u` &&
        `fonts` in document &&
        document.fonts.load(`1rem "${e.fontFamily}"`)
    }, [t])
    let r = (0, T.useMemo)(
      () => ({
        theme: B[t] || B.princess,
        currentTheme: t,
        setTheme: (e) => {
          z(e)
            ? n(e)
            : [`space`, `nature`, `cartoon`].includes(e) && n(`princess`)
        },
      }),
      [t]
    )
    return (0, R.jsx)(V.Provider, { value: r, children: e })
  },
  U = (0, T.createContext)(void 0),
  ze = () => g(U, `useActiveChild`, `ActiveChildProvider`),
  W = `mystarquest:active-child`,
  Be = ve({
    id: y().nullable().catch(null),
    themeId: y().nullable().catch(null),
    ownerUid: y().nullable().catch(null),
  }),
  G = { id: null, themeId: null, ownerUid: null },
  K = typeof window < `u`,
  Ve = (e) => {
    if (!e || !K) return G
    try {
      let t = window.localStorage.getItem(`${W}:${e}`),
        n = Be.safeParse(JSON.parse(t ?? `{}`))
      return n.success ? n.data : G
    } catch (e) {
      console.warn(`Failed to parse stored active child`, e)
    }
    return G
  },
  He = ({ children: e }) => {
    let { user: t } = D()
    return (0, R.jsx)(
      Ue,
      { userId: t?.uid, children: e },
      t?.uid ?? `signed-out`
    )
  },
  Ue = ({ children: e, userId: t }) => {
    let { setTheme: n } = H(),
      [r, i] = (0, T.useState)(() => Ve(t))
    ;(0, T.useEffect)(() => {
      r.themeId && n(r.themeId)
    }, [r.themeId, n])
    let a = (0, T.useCallback)(
        (e) => {
          if ((i(e), t && K))
            try {
              e.id
                ? window.localStorage.setItem(`${W}:${t}`, JSON.stringify(e))
                : window.localStorage.removeItem(`${W}:${t}`)
            } catch (e) {
              console.warn(`Unable to persist active child selection`, e)
            }
        },
        [t]
      ),
      o = (0, T.useCallback)(
        (e) => {
          i((n) => {
            let r = e.ownerUid ?? t ?? null
            if (n.id === e.id && n.themeId === e.themeId && n.ownerUid === r)
              return n
            let i = { id: e.id, themeId: e.themeId, ownerUid: r }
            if (t && K)
              try {
                window.localStorage.setItem(`${W}:${t}`, JSON.stringify(i))
              } catch {}
            return i
          })
        },
        [t]
      ),
      s = (0, T.useCallback)(() => {
        a(G)
      }, [a]),
      c = (0, T.useMemo)(
        () => ({
          activeChildId: r.id,
          activeThemeId: r.themeId,
          activeOwnerUid: r.ownerUid,
          setActiveChild: o,
          clearActiveChild: s,
        }),
        [r.id, r.themeId, r.ownerUid, o, s]
      )
    return (0, R.jsx)(U.Provider, { value: c, children: e })
  },
  q = (e = Date.now()) => b(new Date(e - 3e5)).dateKey,
  J = (0, T.createContext)(void 0),
  Y = () => g(J, `useSelectedDate`, `SelectedDateProvider`),
  We = (e = Se) => {
    let { selectedDate: t } = Y()
    return (0, T.useMemo)(() => xe(t, e), [e, t])
  },
  X = () => b().dateKey,
  Ge = ({ children: e }) => {
    let [t, n] = (0, T.useState)(q),
      [r, i] = (0, T.useState)(X),
      a = (0, T.useCallback)((e) => {
        i(e)
      }, []),
      o = (0, T.useCallback)((e) => {
        i(be(e))
      }, []),
      s = (0, T.useCallback)(() => {
        i(X())
      }, [])
    ;(0, T.useEffect)(() => {
      let e,
        r = () => {
          window.clearTimeout(e)
          let i = q()
          ;(i !== t && (n(i), s()),
            (e = window.setTimeout(r, 6e4 - (Date.now() % 6e4))))
        }
      return (
        window.addEventListener(`focus`, r),
        window.addEventListener(`pageshow`, r),
        document.addEventListener(`visibilitychange`, r),
        r(),
        () => {
          ;(window.clearTimeout(e),
            window.removeEventListener(`focus`, r),
            window.removeEventListener(`pageshow`, r),
            document.removeEventListener(`visibilitychange`, r))
        }
      )
    }, [t, s])
    let c = (0, T.useMemo)(
      () => ({
        nightlyResetKey: t,
        selectedDateKey: r,
        selectedDate: ye(r),
        setSelectedDateKey: a,
        setSelectedDate: o,
        resetSelectedDate: s,
      }),
      [t, r, a, o, s]
    )
    return (0, R.jsx)(J.Provider, { value: c, children: e })
  },
  Ke = () => {
    let { user: e, loading: t } = D(),
      n = f()
    return t
      ? (0, R.jsx)(`main`, {
          className: `flex min-h-screen items-center justify-center bg-slate-950 text-slate-200`,
          children: (0, R.jsx)(`span`, {
            className: `text-lg font-medium`,
            children: `Checking your session…`,
          }),
        })
      : e
        ? (0, R.jsx)(o, {})
        : (0, R.jsx)(d, { to: `/login`, replace: !0, state: { from: n } })
  },
  qe = ({ theme: e, activeTabId: t }) => {
    let n = r()
    return (0, R.jsx)(`nav`, {
      'aria-label': `Primary tabs`,
      style: {
        ...me(e, { bottom: `24px` }, 12),
        display: `grid`,
        gridTemplateColumns: `repeat(${C.length}, minmax(0, 1fr))`,
        gap: `${v.navItemGap}px`,
        padding: `0 12px`,
      },
      children: C.map((r) => {
        let i = r.id === t
        return (0, R.jsx)(
          w,
          {
            type: `button`,
            'aria-label': r.ariaLabel,
            'aria-current': i ? `page` : void 0,
            onClick: () =>
              n(r.path, {
                state: { tabTransitionDirection: S(r.id) < S(t) ? -1 : 1 },
              }),
            style: {
              display: `flex`,
              alignItems: `center`,
              justifyContent: `center`,
              minHeight: `${v.topIconSize}px`,
              background: `transparent`,
              border: `none`,
              cursor: `pointer`,
              transition: `transform 200ms ease, opacity 200ms ease`,
              opacity: i ? 1 : 0.6,
              transform: i ? `scale(1.15)` : `scale(1)`,
              position: `relative`,
              padding: 0,
            },
            children: (0, R.jsx)(`img`, {
              src: x(r.id, e.id),
              alt: ``,
              'aria-hidden': `true`,
              style: {
                width: `${v.topIconSize}px`,
                height: `${v.topIconSize}px`,
                objectFit: `contain`,
                filter: i
                  ? `drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))`
                  : `none`,
              },
            }),
          },
          r.id
        )
      }),
    })
  },
  Je = ({
    theme: e,
    isNativePlatform: t,
    browserFrameHeight: n,
    children: r,
    contentClassName: i = `relative flex w-full flex-col overflow-hidden`,
    contentStyle: a,
  }) =>
    (0, R.jsx)(`div`, {
      className: `flex w-full overflow-hidden transition-colors duration-500 ${t ? `native-safe-area-frame items-stretch justify-start` : `items-center justify-center p-5`}`,
      style: {
        height: `100dvh`,
        background: t ? e.colors.bg : `#000`,
        boxSizing: `border-box`,
      },
      children: (0, R.jsx)(`div`, {
        className: i,
        'data-app-device-frame': !0,
        style: {
          height: t ? `100%` : `${n}px`,
          maxWidth: t ? `100%` : `${v.deviceMaxWidth}px`,
          borderRadius: t ? `0px` : `40px`,
          boxShadow: t ? `none` : `0 0 0 12px #1a1a2e, 0 0 0 14px #333`,
          background: e.colors.bg,
          backgroundImage: e.bgPattern,
          fontFamily: e.fonts.body,
          color: e.colors.text,
          width: `100%`,
          ...a,
        },
        children: r,
      }),
    }),
  Ye = (e) => {
    if (e || typeof window > `u`) return v.deviceMinHeight
    let t = window.screen?.availHeight ?? window.screen?.height,
      n = window.visualViewport?.height ?? window.innerHeight,
      r = t ?? n,
      i = Math.max(320, Math.min(v.deviceMinHeight, r - 40)),
      a = Math.max(320, n - 40)
    return Math.min(i, a)
  },
  Xe = () => {
    let e = h.isNativePlatform(),
      [t, n] = (0, T.useState)(() => Ye(e))
    return (
      (0, T.useEffect)(() => {
        if (e || typeof window > `u`) return
        let t = () => {
          n(Ye(!1))
        }
        return (
          window.addEventListener(`resize`, t),
          window.visualViewport?.addEventListener(`resize`, t),
          () => {
            ;(window.removeEventListener(`resize`, t),
              window.visualViewport?.removeEventListener(`resize`, t))
          }
        )
      }, [e]),
      { isNativePlatform: e, browserFrameHeight: t }
    )
  },
  Ze = ({ src: e, loading: t, label: n, size: r = 96 }) => {
    let i = (0, T.useRef)(null),
      a = (0, T.useRef)(+!t)
    return (
      (0, T.useLayoutEffect)(() => {
        let e = i.current
        if (!e) return
        let n = 0,
          r = (t) => {
            ;((a.current = t),
              e.style.setProperty(`--resource-fill-angle`, `${t * 360}deg`))
          }
        if (window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches) {
          r(+!t)
          return
        }
        let o = t ? 0 : a.current
        r(o)
        let s = performance.now(),
          c = (e) => {
            let i = e - s,
              a = Math.min(i / (t ? 4e3 : 180), 1)
            ;(r(t ? 0.9 * a : o + (1 - o) * a),
              a < 1 && (n = requestAnimationFrame(c)))
          }
        return (
          (t || o < 1) && (n = requestAnimationFrame(c)),
          () => cancelAnimationFrame(n)
        )
      }, [t, e]),
      (0, R.jsxs)(`span`, {
        ref: i,
        className: `resource-loading-icon`,
        role: t ? `status` : void 0,
        'aria-label': t ? n : void 0,
        'aria-busy': t || void 0,
        style: { width: r, height: r },
        children: [
          (0, R.jsx)(`img`, {
            className: `resource-loading-icon-base`,
            src: e,
            alt: ``,
          }),
          (0, R.jsx)(`img`, {
            className: `resource-loading-icon-fill`,
            src: e,
            alt: ``,
          }),
        ],
      })
    )
  },
  Qe = class extends T.Component {
    state = { hasError: !1 }
    static getDerivedStateFromError() {
      return { hasError: !0 }
    }
    componentDidCatch(e, t) {
      console.error(`Failed to load or render tab`, e, t)
    }
    render() {
      return this.state.hasError
        ? (0, R.jsxs)(`div`, {
            role: `alert`,
            className: `flex h-full flex-col items-center justify-center gap-4 px-6 pb-32 text-center`,
            children: [
              (0, R.jsx)(`h1`, {
                className: `text-xl font-bold`,
                children: `This page couldn’t load.`,
              }),
              (0, R.jsx)(`p`, {
                children: `Choose another tab or reload to try again.`,
              }),
              (0, R.jsx)(`button`, {
                type: `button`,
                onClick: () => window.location.reload(),
                className: `rounded-xl border-2 border-current px-5 py-3 font-bold`,
                children: `Reload`,
              }),
            ],
          })
        : (0, R.jsx)(T.Suspense, {
            fallback: (0, R.jsx)(`div`, {
              className: `flex h-full items-center justify-center px-6 pb-32 text-lg font-bold`,
              children: (0, R.jsx)(Ze, {
                src: this.props.loadingIcon,
                loading: !0,
                label: `Loading page`,
              }),
            }),
            children: this.props.children,
          })
    }
  }
function $e({ children: e }) {
  return ((0, T.useEffect)(() => L(`route-mounted`), []), e)
}
var et = (0, T.createContext)(!0),
  tt = (0, T.createContext)(null),
  nt = v.tabTransitionMs,
  rt = () => {
    let { theme: e } = H(),
      t = f(),
      { isNativePlatform: n, browserFrameHeight: r } = Xe(),
      i = Ce(t.pathname),
      a = s(),
      o = (0, T.useRef)(null),
      [c, l] = (0, T.useState)({}),
      u = i === `chores` || i === `tests`
    u && !c[i] && l((e) => ({ ...e, [i]: a }))
    let d = `translate3d(${it(t.state) * 18}px, 0, 0)`,
      p = {
        animation: `msq-tab-enter ${nt}ms ease forwards`,
        '--msq-tab-enter-transform': d,
        willChange: `opacity, transform`,
      }
    return (0, R.jsx)(tt, {
      value: o,
      children: (0, R.jsxs)(Je, {
        theme: e,
        isNativePlatform: n,
        browserFrameHeight: r,
        children: [
          (0, R.jsxs)(`div`, {
            className: `relative min-h-0 flex-1 overflow-hidden`,
            children: [
              [`chores`, `tests`].map(
                (t) =>
                  c[t] &&
                  (0, R.jsx)(
                    `div`,
                    {
                      hidden: i !== t,
                      inert: i !== t,
                      className: `h-full w-full min-w-0`,
                      style: i === t ? p : void 0,
                      children: (0, R.jsx)(et, {
                        value: i === t,
                        children: (0, R.jsx)(Qe, {
                          loadingIcon: x(t, e.id),
                          children: (0, R.jsx)($e, { children: c[t] }),
                        }),
                      }),
                    },
                    t
                  )
              ),
              !u &&
                (0, R.jsx)(
                  `div`,
                  {
                    className: `h-full w-full min-w-0`,
                    style: p,
                    children: (0, R.jsx)(Qe, {
                      loadingIcon: x(i ?? `chores`, e.id),
                      children: (0, R.jsx)($e, { children: a }),
                    }),
                  },
                  t.pathname
                ),
            ],
          }),
          i && (0, R.jsx)(qe, { theme: e, activeTabId: i }),
        ],
      }),
    })
  },
  it = (e) =>
    !e || typeof e != `object` || !(`tabTransitionDirection` in e)
      ? 1
      : e.tabTransitionDirection === -1
        ? -1
        : 1,
  at = (e) =>
    e instanceof Error
      ? e
      : Error(typeof e == `string` ? e : `Unexpected application error`),
  ot = class extends T.Component {
    state = { error: null }
    static getDerivedStateFromError(e) {
      return { error: e }
    }
    listeners
    componentDidMount() {
      this.listeners = new AbortController()
      let { signal: e } = this.listeners
      ;(window.addEventListener(`error`, this.handleWindowError, { signal: e }),
        window.addEventListener(
          `unhandledrejection`,
          this.handleUnhandledRejection,
          { signal: e }
        ))
    }
    componentWillUnmount() {
      this.listeners?.abort()
    }
    componentDidCatch(e, t) {
      console.error(`Unhandled app render error`, e, t)
    }
    handleWindowError = (e) => {
      let t = e.error instanceof Error ? e.error : at(e.message)
      console.error(`Unhandled app window error`, t)
    }
    handleUnhandledRejection = (e) => {
      let t = at(e.reason)
      console.error(`Unhandled app promise rejection`, t)
    }
    render() {
      return this.state.error
        ? (0, R.jsx)(`main`, {
            className: `flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100`,
            children: (0, R.jsxs)(`section`, {
              className: `max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl`,
              children: [
                (0, R.jsx)(`h1`, {
                  className: `text-xl font-bold`,
                  children: `Something went wrong.`,
                }),
                (0, R.jsx)(`p`, {
                  className: `mt-2 text-sm text-slate-300`,
                  children: `Your saved progress is still on this device. Check your connection and try again.`,
                }),
                (0, R.jsx)(`button`, {
                  type: `button`,
                  className: `mt-4 rounded-xl border px-5 py-3 font-bold`,
                  onClick: () => window.location.reload(),
                  children: `Retry`,
                }),
              ],
            }),
          })
        : this.props.children
    }
  },
  st = ({ actionError: e, retryAction: t }) =>
    e
      ? (0, R.jsxs)(`div`, {
          role: `alert`,
          children: [
            e,
            ` `,
            (0, R.jsx)(`button`, {
              type: `button`,
              onClick: t,
              children: `Retry`,
            }),
          ],
        })
      : null,
  ct = 8,
  lt = `button, input, textarea, select, option, label, a, [role="button"], [data-no-drag-scroll="true"]`,
  ut = ({
    children: e,
    className: t,
    contentClassName: n,
    contentStyle: r,
    as: i = `main`,
    bottomNavPadding: a = !1,
    topNavPadding: o = !1,
  }) => {
    let s = (0, T.useRef)(null),
      [c, l] = (0, T.useState)(!1),
      [u, d] = (0, T.useState)(!1),
      f = i
    ;(0, T.useEffect)(() => {
      let e = s.current
      if (!e) return
      let t = new AbortController(),
        { signal: n } = t,
        r,
        i = !1,
        a,
        o = () => d(e.scrollHeight > e.clientHeight + 1),
        c = new ResizeObserver(o)
      ;(c.observe(e),
        Array.from(e.children).forEach((e) => c.observe(e)),
        o(),
        e.addEventListener(`scroll`, o, { passive: !0, signal: n }))
      let u = () => {
        ;(r?.abort(), (r = void 0), l(!1))
      }
      return (
        e.addEventListener(
          `mousedown`,
          (t) => {
            if (
              t.button !== 0 ||
              e.scrollHeight <= e.clientHeight + 1 ||
              (t.target instanceof Element && t.target.closest(lt))
            )
              return
            ;(u(), clearTimeout(a), (i = !1))
            let n = {
              startY: t.clientY,
              startScrollTop: e.scrollTop,
              hasMoved: !1,
            }
            r = new AbortController()
            let { signal: o } = r,
              s = document.body.style.userSelect
            ;((document.body.style.userSelect = `none`),
              o.addEventListener(
                `abort`,
                () => {
                  document.body.style.userSelect = s
                },
                { once: !0 }
              ),
              window.addEventListener(
                `mousemove`,
                (t) => {
                  let r = t.clientY - n.startY
                  ;(!n.hasMoved &&
                    Math.abs(r) >= ct &&
                    ((n.hasMoved = !0), (i = !0), l(!0)),
                    n.hasMoved &&
                      (t.preventDefault(),
                      (e.scrollTop = n.startScrollTop - r * 1.5)))
                },
                { signal: o }
              ),
              window.addEventListener(
                `mouseup`,
                () => {
                  ;(u(),
                    (a = setTimeout(() => {
                      i = !1
                    }, 0)))
                },
                { signal: o }
              ),
              window.addEventListener(
                `blur`,
                () => {
                  ;(u(), (i = !1))
                },
                { signal: o }
              ))
          },
          { signal: n }
        ),
        e.addEventListener(
          `click`,
          (e) => {
            i && (e.preventDefault(), e.stopPropagation())
          },
          { capture: !0, signal: n }
        ),
        () => {
          ;(t.abort(), r?.abort(), clearTimeout(a), c.disconnect())
        }
      )
    }, [])
    let p = [`relative flex flex-col overflow-hidden`, t || `flex-1 min-h-0`]
      .filter(Boolean)
      .join(` `)
    return (0, R.jsx)(f, {
      className: p,
      children: (0, R.jsx)(`div`, {
        ref: s,
        className: [
          `app-scroll-region`,
          `min-h-0 flex-1`,
          u ? `can-drag-scroll` : ``,
          c ? `is-dragging` : ``,
          n ?? ``,
        ]
          .filter(Boolean)
          .join(` `),
        style: {
          overscrollBehavior: `contain`,
          WebkitOverflowScrolling: `touch`,
          paddingTop: o ? `${v.floatingNavHeight + 24}px` : void 0,
          paddingBottom: a ? `${v.floatingNavHeight + 48}px` : void 0,
          ...r,
        },
        children: e,
      }),
    })
  },
  dt = ({ theme: e, title: t, right: n, fontFamily: r }) =>
    (0, R.jsxs)(`header`, {
      className: `flex items-center gap-3`,
      style: { ...me(e, { top: `12px` }), padding: `0 16px` },
      children: [
        (0, R.jsx)(`h1`, {
          className: `font-bold tracking-wide`,
          style: {
            fontFamily: r || `inherit`,
            textAlign: `left`,
            fontSize: `clamp(18px, 5.5vw, ${Math.round(v.topIconSize * 0.65)}px)`,
            color: e.colors.primary,
            lineHeight: `1`,
            flex: 1,
            minWidth: 0,
            overflow: `hidden`,
            textOverflow: `ellipsis`,
            whiteSpace: `nowrap`,
          },
          children: t,
        }),
        (0, R.jsx)(`div`, {
          className: `flex items-center justify-end gap-2`,
          style: { flexShrink: 0 },
          children: n,
        }),
      ],
    }),
  ft = 56,
  pt = 48,
  Z = ({
    theme: e,
    title: t,
    headerRight: n,
    bottomBar: i,
    activeTabId: a,
    scrollable: o = !0,
    contentClassName: s,
    contentStyle: c,
    children: l,
  }) => {
    let u = r(),
      d = Ee(),
      { isNativePlatform: f, browserFrameHeight: p } = Xe(),
      m = (0, T.useRef)(null),
      h = i || (a && (0, R.jsx)(qe, { theme: e, activeTabId: a })),
      g = (e) => {
        let t = e.touches[0]
        t && (m.current = { x: t.clientX, y: t.clientY })
      },
      ee = (e) => {
        let t = m.current
        m.current = null
        let n = e.changedTouches[0]
        if (!t || !n || !a) return
        let r = n.clientX - t.x,
          i = n.clientY - t.y
        if (Math.abs(i) > pt || Math.abs(r) < ft) return
        let o = Te(a, r < 0 ? 1 : -1)
        o && d.runAction(`Open tab`, `navigate`, () => u(o))
      }
    return (0, R.jsxs)(Je, {
      theme: e,
      isNativePlatform: f,
      browserFrameHeight: p,
      children: [
        t &&
          (0, R.jsx)(dt, {
            theme: e,
            title: t,
            right: n,
            fontFamily: e.fonts.heading,
          }),
        (0, R.jsx)(`div`, {
          className: s || `flex min-h-0 flex-1 flex-col overflow-hidden`,
          style: {
            paddingLeft: `0px`,
            paddingRight: `0px`,
            paddingTop: `0px`,
            paddingBottom: `${v.pagePaddingBottom}px`,
            touchAction: a ? `pan-y` : void 0,
            ...c,
          },
          onTouchStart: a ? g : void 0,
          onTouchEnd: a ? ee : void 0,
          children: o
            ? (0, R.jsx)(ut, {
                className: `min-h-0 flex-1`,
                topNavPadding: !!t,
                bottomNavPadding: !!a,
                children: l,
              })
            : l,
        }),
        (0, R.jsx)(st, { ...d }),
        h,
      ],
    })
  },
  mt = ({
    label: e,
    icon: t,
    theme: n,
    color: r,
    onClick: i,
    disabled: a,
    hideArrow: o,
    content: s,
    ariaPressed: c,
    styleOverride: l,
    className: u = ``,
  }) => {
    let d = { ..._e(n, r), ...l, position: `relative`, overflow: `hidden` },
      f = (0, R.jsxs)(R.Fragment, {
        children: [
          (0, R.jsxs)(`span`, {
            className: `flex items-center`,
            style: { gap: `${v.actionRowGap}px` },
            children: [
              (0, R.jsx)(`span`, {
                className: `flex items-center justify-center`,
                style: {
                  fontSize: `${v.actionButtonIconSize}px`,
                  width: `${v.actionButtonIconSize}px`,
                  height: `${v.actionButtonIconSize}px`,
                  lineHeight: 1,
                  flexShrink: 0,
                },
                children: t,
              }),
              (0, R.jsx)(`span`, { children: e }),
            ],
          }),
          !o &&
            (0, R.jsx)(`span`, {
              className: `opacity-60 transition-transform group-hover:translate-x-2`,
              style: { fontSize: `${v.actionButtonArrowSize}px` },
              children: `→`,
            }),
        ],
      })
    return (0, R.jsx)(w, {
      type: `button`,
      'aria-label': e,
      onClick: i,
      style: d,
      disabled: a,
      className: `group ${u}`.trim(),
      'aria-pressed': c,
      children: s ? (0, R.jsx)(De, { children: s }) : f,
    })
  },
  ht = `data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3csvg%20width='100%25'%20height='100%25'%20viewBox='0%200%2063%2057'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20xml:space='preserve'%20xmlns:serif='http://www.serif.com/'%20style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;'%3e%3cg%20id='Background'%3e%3cpath%20d='M5.927,16.867c14.689,-26.305%2048.649,-11.394%2043.985,-6.914c-0.301,0.289%20-6.005,6.244%20-7.721,5.463c-0.482,-0.219%20-17.386,-10.797%20-26.344,7.879c-6.754,-4.835%20-6.461,-5.274%20-9.92,-6.428Z'%20style='fill:%23e84134;'/%3e%3cpath%20d='M15.629,33.102c6.749,13.791%2019.37,12.37%2026.794,8.147c0.479,0.725%201.15,1.74%208.594,7.091c-10.662,9.669%20-35.205,9.838%20-44.992,-8.657c3.565,-1.374%206.876,-4.374%209.604,-6.581Z'%20style='fill:%2333a752;'/%3e%3cpath%20d='M42.423,41.249c7.082,-6.406%204.363,-7.702%203.628,-7.753c-2.811,-0.198%20-13.372,1.011%20-14.025,-1.326c-0.001,-0.003%200.081,-7.979%200.096,-8.04c0.391,-1.603%202.064,-1.21%2020.774,-1.209c3.461,0%207.876,-1.86%206.898,7.527c-1.178,11.31%20-4.402,13.856%20-8.776,17.893c-7.444,-5.351%20-8.115,-6.366%20-8.594,-7.091Z'%20style='fill:%234285f4;'/%3e%3cpath%20d='M5.927,16.867c3.459,1.154%203.166,1.593%209.92,6.428c-1.084,4.87%20-1.069,4.869%20-0.218,9.807c-2.728,2.207%20-6.039,5.208%20-9.604,6.581c-0.766,-1.743%20-6.19,-10.233%20-0.098,-22.816Z'%20style='fill:%23f9ba05;'/%3e%3c/g%3e%3c/svg%3e`,
  gt = (e) => (
    window.addEventListener(`online`, e),
    window.addEventListener(`offline`, e),
    () => {
      ;(window.removeEventListener(`online`, e),
        window.removeEventListener(`offline`, e))
    }
  ),
  _t = () => navigator.onLine !== !1,
  vt = () => (0, T.useSyncExternalStore)(gt, _t),
  yt = (e) => {
    if (!e || typeof e != `object` || !(`from` in e)) return `/`
    let t = e.from
    return t && typeof t == `object` && `pathname` in t
      ? String(t.pathname)
      : `/`
  },
  bt = () => {
    let { user: e, loading: t, loginWithGoogle: n } = D(),
      { theme: r } = H(),
      i = f(),
      a = vt(),
      [o, s] = (0, T.useState)(!1),
      c = !t && !!e,
      [l, u] = (0, T.useState)(null),
      p = async () => {
        if (a) {
          ;(s(!0), u(null))
          try {
            await n()
          } catch (e) {
            ;(console.error(`Login failed:`, e),
              u(`Login failed. Please close the popup and try again.`),
              s(!1))
          }
        }
      }
    if (c) return (0, R.jsx)(d, { to: yt(i.state), replace: !0 })
    let m = t || o
    return (0, R.jsx)(Z, {
      theme: r,
      contentClassName: `flex flex-1 items-center justify-center`,
      children: (0, R.jsxs)(`section`, {
        className: `w-full space-y-6 rounded-xl bg-black/30 p-8 shadow-lg`,
        style: ge(),
        children: [
          (0, R.jsxs)(`header`, {
            className: `space-y-2 text-center`,
            children: [
              (0, R.jsx)(`h1`, {
                className: `text-3xl font-semibold`,
                children: `Sign in to MyStarQuest`,
              }),
              (0, R.jsx)(`p`, {
                className: `opacity-70`,
                children: `Use your Google account to start awarding stars and track progress in real time.`,
              }),
            ],
          }),
          l &&
            (0, R.jsxs)(`div`, {
              className: `rounded-lg border border-red-700 bg-red-900/30 p-4 text-center text-red-200`,
              role: `alert`,
              children: [
                (0, R.jsx)(`p`, {
                  className: `font-medium`,
                  children: `Error signing in`,
                }),
                (0, R.jsx)(`p`, { className: `text-sm`, children: l }),
              ],
            }),
          !a &&
            (0, R.jsx)(`p`, {
              role: `status`,
              className: `text-center`,
              children: `Connect to sign in.`,
            }),
          (0, R.jsx)(mt, {
            theme: r,
            color: r.colors.primary,
            label: o ? `Signing in...` : t ? `Loading...` : `Google Account`,
            icon: (0, R.jsx)(`img`, {
              src: ht,
              alt: `Google`,
              style: { width: `36px`, height: `36px`, objectFit: `contain` },
            }),
            onClick: p,
            disabled: m || !a,
          }),
        ],
      }),
    })
  },
  Q = {
    chores: () =>
      i(
        () => import(`./DashboardPage-HSmbkqk7.js`),
        __vite__mapDeps([
          10, 2, 1, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 5, 24,
          25, 3, 9, 6, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
        ])
      ),
    tests: () =>
      i(
        () => import(`./TestsPage-C28IvfIK.js`).then((e) => e.t),
        __vite__mapDeps([
          38, 2, 1, 11, 12, 13, 39, 16, 17, 15, 18, 19, 20, 21, 22, 23, 5, 24,
          14, 25, 3, 9, 6, 26, 27, 28, 29, 30, 31, 40, 41, 33, 34, 35, 42,
        ])
      ),
    rewards: () =>
      i(
        () => import(`./RewardsPage-BeHrOEUz.js`),
        __vite__mapDeps([
          43, 2, 1, 11, 12, 13, 19, 16, 17, 18, 20, 21, 22, 23, 5, 24, 14, 25,
          3, 9, 6, 26, 27, 28, 44, 45, 46, 41, 47, 33, 34, 35, 36, 37, 30, 31,
          48, 40, 49,
        ])
      ),
    timeExplorer: () =>
      i(
        () => import(`./TimeExplorerPage-B-t8aZ5x.js`).then((e) => e.t),
        __vite__mapDeps([
          50, 2, 1, 11, 12, 13, 5, 14, 51, 19, 21, 24, 23, 25, 3, 9, 6, 26, 27,
          28, 52, 4, 53,
        ])
      ),
    manageChildren: () =>
      i(
        () => import(`./ManageChildrenPage-DSeSjtmZ.js`),
        __vite__mapDeps([
          54, 2, 1, 11, 12, 13, 35, 20, 19, 16, 17, 21, 22, 18, 25, 3, 9, 5, 14,
          23, 6, 26, 27, 55, 33, 34, 42, 48, 40, 44, 45, 46, 41, 36,
        ])
      ),
    protectedData: () =>
      i(
        () => import(`./ProtectedDataRoute-RYfVrvbb.js`),
        __vite__mapDeps([
          56, 2, 1, 23, 5, 25, 3, 9, 14, 6, 26, 27, 33, 34, 35, 12,
        ])
      ),
  },
  xt = new Map([
    [`/`, `chores`],
    [`/tabs`, `chores`],
    [`/today`, `chores`],
    [`/tabs/dashboard`, `chores`],
    [`/tabs/chores`, `chores`],
    [`/settings/manage-chores`, `chores`],
    [`/tabs/tests`, `tests`],
    [`/settings/manage-tests`, `tests`],
    [`/tabs/rewards`, `rewards`],
    [`/settings/manage-rewards`, `rewards`],
    [`/tabs/time-explorer`, `timeExplorer`],
    [`/settings/manage-children`, `manageChildren`],
  ])
function St(e) {
  let t = xt.get(e.replace(/\/$/, ``) || `/`)
  return t ? Q[t] : null
}
function Ct() {
  let { pathname: e } = f(),
    { user: t, loading: n } = D()
  return (
    (0, T.useEffect)(() => {
      if (!t && !(n && Ne())) return
      let r = St(e)
      r && Promise.all([Q.protectedData(), r()]).catch(() => {})
    }, [e, t, n]),
    null
  )
}
var wt = (0, T.lazy)(() =>
    i(
      () => import(`./InvitationPage-DDPwc2Kq.js`),
      __vite__mapDeps([57, 1, 2, 26, 42])
    )
  ),
  Tt = (0, T.lazy)(Q.chores),
  Et = (0, T.lazy)(Q.tests),
  Dt = (0, T.lazy)(Q.rewards),
  Ot = (0, T.lazy)(Q.timeExplorer),
  kt = (0, T.lazy)(Q.manageChildren),
  At = (0, T.lazy)(Q.protectedData),
  jt = () =>
    (0, R.jsx)(ot, {
      children: (0, R.jsxs)(Ie, {
        children: [
          (0, R.jsx)(je, {}),
          (0, R.jsx)(Re, {
            children: (0, R.jsx)(Ge, {
              children: (0, R.jsx)(He, {
                children: (0, R.jsxs)(l, {
                  children: [
                    (0, R.jsx)(Ct, {}),
                    (0, R.jsx)(Ae, {}),
                    (0, R.jsx)(T.Suspense, {
                      fallback: (0, R.jsx)(`div`, {
                        role: `status`,
                        className: `flex h-screen w-full items-center justify-center bg-pink-50 text-purple-950`,
                        children: `Opening MyStarQuest…`,
                      }),
                      children: (0, R.jsxs)(u, {
                        children: [
                          (0, R.jsx)(n, {
                            path: `/invite/:inviteId`,
                            element: (0, R.jsx)(wt, {}),
                          }),
                          (0, R.jsx)(n, {
                            path: `/login`,
                            element: (0, R.jsx)(bt, {}),
                          }),
                          (0, R.jsx)(n, {
                            element: (0, R.jsx)(Ke, {}),
                            children: (0, R.jsxs)(n, {
                              element: (0, R.jsx)(At, {}),
                              children: [
                                (0, R.jsx)(n, {
                                  path: `/`,
                                  element: (0, R.jsx)(d, {
                                    to: we,
                                    replace: !0,
                                  }),
                                }),
                                (0, R.jsxs)(n, {
                                  path: `/tabs`,
                                  element: (0, R.jsx)(rt, {}),
                                  children: [
                                    (0, R.jsx)(n, {
                                      path: `chores`,
                                      element: (0, R.jsx)(Tt, {}),
                                    }),
                                    (0, R.jsx)(n, {
                                      path: `tests`,
                                      element: (0, R.jsx)(Et, {}),
                                    }),
                                    (0, R.jsx)(n, {
                                      path: `dashboard`,
                                      element: (0, R.jsx)(d, {
                                        to: `/tabs/chores`,
                                        replace: !0,
                                      }),
                                    }),
                                    (0, R.jsx)(n, {
                                      path: `time-explorer`,
                                      element: (0, R.jsx)(Ot, {}),
                                    }),
                                    (0, R.jsx)(n, {
                                      path: `rewards`,
                                      element: (0, R.jsx)(Dt, {}),
                                    }),
                                  ],
                                }),
                                (0, R.jsx)(n, {
                                  path: `/today`,
                                  element: (0, R.jsx)(d, {
                                    to: `/tabs/chores`,
                                    replace: !0,
                                  }),
                                }),
                                (0, R.jsx)(n, {
                                  path: `/settings/manage-children`,
                                  element: (0, R.jsx)(kt, {}),
                                }),
                                (0, R.jsx)(n, {
                                  path: `/settings/manage-chores`,
                                  element: (0, R.jsx)(d, {
                                    to: `/tabs/chores`,
                                    replace: !0,
                                  }),
                                }),
                                (0, R.jsx)(n, {
                                  path: `/settings/manage-tests`,
                                  element: (0, R.jsx)(d, {
                                    to: `/tabs/tests`,
                                    replace: !0,
                                  }),
                                }),
                                (0, R.jsx)(n, {
                                  path: `/settings/manage-rewards`,
                                  element: (0, R.jsx)(d, {
                                    to: `/tabs/rewards`,
                                    replace: !0,
                                  }),
                                }),
                              ],
                            }),
                          }),
                          (0, R.jsx)(n, {
                            path: `*`,
                            element: (0, R.jsx)(d, { to: `/`, replace: !0 }),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              }),
            }),
          }),
        ],
      }),
    })
function Mt() {
  if (h.isNativePlatform() || !(`serviceWorker` in navigator)) return
  let e = !1,
    t = () =>
      navigator.serviceWorker.controller?.postMessage({
        type: `CACHE_VISITED`,
        urls: performance.getEntriesByType(`resource`).map((e) => e.name),
      })
  navigator.serviceWorker.addEventListener(`controllerchange`, t)
  let n = async () => {
    if (!(e || navigator.onLine === !1)) {
      e = !0
      try {
        let e = await navigator.serviceWorker.register(`/sw.js`, {
          updateViaCache: `none`,
        })
        ;(t(), e.active && e.update().catch(() => {}))
      } catch {
      } finally {
        e = !1
      }
    }
  }
  ;(window.addEventListener(`online`, () => {
    n()
  }),
    O(() => {
      n()
    }))
}
L(`start`)
var $ = document.getElementById(`root`)
if (!$) throw Error(`The application root element is missing.`)
;((0, Oe.createRoot)($).render(
  (0, R.jsx)(T.StrictMode, { children: (0, R.jsx)(jt, {}) })
),
  Mt())
export {
  D as C,
  A as S,
  L as _,
  ut as a,
  Me as b,
  tt as c,
  We as d,
  q as f,
  z as g,
  H as h,
  dt as i,
  Ze as l,
  B as m,
  mt as n,
  st as o,
  ze as p,
  Z as r,
  et as s,
  vt as t,
  Y as u,
  P as v,
  k as x,
  F as y,
}
