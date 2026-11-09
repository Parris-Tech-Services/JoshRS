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
        versionCode = 3
        versionName = "0.4-377-lumbridge-cache"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildTypes {
        getByName("debug") {
            // GitHub builds have independently generated debug signing keys.
            // A shared applicationId would trigger Android's signature/update
            // conflict (and can accidentally target a prior private cache vault).
            // Every CI run therefore installs a SIDE-BY-SIDE, disposable app.
            // Locally built previews use their own .playtestlocal identity.
            val playtestId = providers.gradleProperty("joshrsPlaytestBuildId").orNull ?: "local"
            require(playtestId.matches(Regex("[A-Za-z0-9]{1,32}"))) {
                "Playtest build ID must be a short alphanumeric token"
            }
            applicationIdSuffix = ".playtest$playtestId"
            versionNameSuffix = "-playtest"
        }
        release {
            isMinifyEnabled = false
        }
    }
}

dependencies {
    // Apache-2.0 licensed decompression for authentic 377 versionlist Jagfiles.
    implementation("org.apache.commons:commons-compress:1.28.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test:core:1.6.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
}
