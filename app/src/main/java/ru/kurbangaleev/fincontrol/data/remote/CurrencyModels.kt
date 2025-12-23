package ru.kurbangaleev.fincontrol.data.remote

import com.google.gson.annotations.SerializedName

data class CurrencyResponse(
    @SerializedName("rates")
    val rates: Map<String, Double>
)