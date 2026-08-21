package com.francirene.eduapp.network

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

/**
 * Express-session auth relies entirely on a "connect.sid" cookie.
 * A single shared instance of this jar must be reused across every request
 * (see ApiClient) so the session cookie set on login is sent on every
 * subsequent call, exactly like a browser tab does.
 */
class SessionCookieJar : CookieJar {

    private val store = mutableMapOf<String, MutableList<Cookie>>()

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        if (cookies.isEmpty()) return
        val list = store.getOrPut(url.host) { mutableListOf() }
        for (cookie in cookies) {
            list.removeAll { it.name == cookie.name }
            list.add(cookie)
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        val list = store[url.host] ?: return emptyList()
        val valid = list.filter { it.expiresAt > now }
        store[url.host] = valid.toMutableList()
        return valid
    }

    fun clear() {
        store.clear()
    }
}
