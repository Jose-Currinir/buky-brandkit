package cl.butake.buky.icons

import platform.UIKit.UIApplication
import platform.darwin.dispatch_async
import platform.darwin.dispatch_get_main_queue

/**
 * iOS implementation: UIApplication.setAlternateIconName.
 * Alternate icon names must be declared in Info.plist under CFBundleAlternateIcons
 * (see integration/ios/Info-AlternateIcons.plist). "default" passes null to restore the primary.
 *
 * Note: iOS shows a system alert when the icon changes (standard behavior). The icon files
 * must be in the app bundle (not the asset catalog) — see references/native-ios.md.
 */
actual class IconManager actual constructor() {

    private val themes = listOf("default", "pride", "halloween", "holiday")

    actual fun availableThemes(): List<String> = themes

    actual fun currentTheme(): String =
        UIApplication.sharedApplication.alternateIconName ?: "default"

    actual fun setTheme(themeKey: String) {
        val app = UIApplication.sharedApplication
        // supportsAlternateIcons is an Objective-C property — property access, not a function call.
        if (!app.supportsAlternateIcons) return
        val name: String? = if (themeKey == "default" || themeKey !in themes) null else themeKey
        // setAlternateIconName must run on the main thread.
        // ObjC selector is setAlternateIconName:completionHandler: — verify the named
        // completionHandler parameter matches your Kotlin/Native UIKit bindings version.
        dispatch_async(dispatch_get_main_queue()) {
            app.setAlternateIconName(name, completionHandler = { error ->
                if (error != null) println("brandkit: icon change failed: ${error.localizedDescription}")
            })
        }
    }
}
