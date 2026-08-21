package com.francirene.eduapp.util

import android.content.Context
import android.widget.Toast
import retrofit2.Response

fun Context.toast(msg: String) {
    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}

/** Extracts a "message" field from a failed Retrofit response body, if present. */
fun <T> Response<T>.errorMessageOrDefault(default: String = "Something went wrong"): String {
    return try {
        val raw = errorBody()?.string()
        if (raw.isNullOrBlank()) return default
        val regex = Regex("\"message\"\\s*:\\s*\"([^\"]*)\"")
        regex.find(raw)?.groupValues?.get(1) ?: default
    } catch (e: Exception) {
        default
    }
}
