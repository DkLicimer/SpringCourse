plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("com.google.devtools.ksp")
    id("kotlin-parcelize")
}

android {
    namespace = "ru.kurbangaleev.fincontrol"
    compileSdk {
        version = release(36)
    }

    defaultConfig {
        applicationId = "ru.kurbangaleev.fincontrol"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    // 1. Навигация (Navigation Compose)
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // 2. База данных (Room) - Критерий "Реализация БД"
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion") // Для Coroutines
    ksp("androidx.room:room-compiler:$roomVersion")

    // 3. Сеть (Retrofit + Gson) - Критерий "Обработка сетевых запросов"
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // 4. Графики (Vico - современная библиотека для Compose) - Критерий "Эстетика"
    implementation("com.patrykandpatrick.vico:compose:1.14.0")
    implementation("com.patrykandpatrick.vico:compose-m3:1.14.0")
    implementation("com.patrykandpatrick.vico:core:1.14.0")

    // 5. Иконки (расширенный набор Material Icons)
    implementation("androidx.compose.material:material-icons-extended:1.6.3")

    // 6. Сохранение простых данных (DataStore вместо SharedPreferences)
    implementation("androidx.datastore:datastore-preferences:1.0.0")
}