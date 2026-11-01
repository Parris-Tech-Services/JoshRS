plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "au.com.parristech.joshrs.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "au.com.parristech.joshrs.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "0.2-visual-prototype"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
