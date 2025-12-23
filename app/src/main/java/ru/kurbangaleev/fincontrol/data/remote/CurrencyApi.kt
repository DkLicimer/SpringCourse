package ru.kurbangaleev.fincontrol.data.remote

import retrofit2.http.GET

interface CurrencyApi {
    // Просто запрашиваем курс относительно USD
    @GET("latest/USD")
    suspend fun getUsdRate(): CurrencyResponse
}