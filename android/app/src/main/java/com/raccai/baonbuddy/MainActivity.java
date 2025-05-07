package com.raccai.baonbuddy; // Make sure this matches your actual package name

import android.os.Bundle;
import androidx.core.view.WindowCompat; // <<< IMPORT THIS

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Makes the app lay out edge-to-edge, allowing content to draw behind system bars.
    // This is crucial for `env(safe-area-inset-...)` to work correctly with padding.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false); // <<< ADD THIS LINE
  }
}