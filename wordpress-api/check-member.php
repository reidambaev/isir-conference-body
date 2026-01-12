/**
 * ISIR Member Verification API
 * 
 * Snippet Title: ISIR Member Check API
 * Description: REST API endpoint to verify member registration by email/name
 * Endpoint: /wp-json/isir/v1/check-member
 * Method: POST
 * 
 * To use: Go to WPCode > Add Snippet > Add Your Custom Code
 * Set "Code Type" to "PHP Snippet" and paste this code
 */

// Add CORS headers for the REST API
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        
        // Allow specific origins (add your production domains here)
        $allowed_origins = array(
            'http://localhost:5173',
            'http://localhost:3000',
            'https://conference.theisir.org',
            'https://isir-conference.pages.dev',
        );
        
        if ($origin && in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
        }
        
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-ISIR-API-Key');
        header('Access-Control-Allow-Credentials: true');
        
        return $value;
    });
}, 15);

// Handle preflight OPTIONS requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = get_http_origin();
        
        $allowed_origins = array(
            'http://localhost:5173',
            'http://localhost:3000',
            'https://conference.theisir.org',
            'https://isir-conference.pages.dev',
        );
        
        if ($origin && in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
        }
        
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-ISIR-API-Key');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        status_header(200);
        exit();
    }
});

// Register the REST API endpoint
add_action('rest_api_init', function () {
    register_rest_route('isir/v1', '/check-member', array(
        'methods'             => 'POST',
        'callback'            => 'isir_check_member_registration',
        'permission_callback' => 'isir_check_member_permission',
        'args'                => array(
            'email' => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => function($param) {
                    return is_email($param);
                },
                'description'       => 'The email address to check',
            ),
            'name' => array(
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'The name to verify (first name, last name, or full name)',
            ),
        ),
    ));
});

/**
 * Permission callback - can be modified for API key authentication
 */
function isir_check_member_permission($request) {
    // Option 1: Public access (not recommended for production)
    // return true;
    
    // Option 2: Check for API key in header
    $api_key = $request->get_header('X-ISIR-API-Key');
    $valid_api_key = get_option('isir_member_api_key', '');
    
    if (empty($valid_api_key)) {
        // If no API key is set, allow access (for initial setup)
        return true;
    }
    
    return hash_equals($valid_api_key, $api_key);
}

/**
 * Main callback function to check member registration
 */
function isir_check_member_registration($request) {
    $email = $request->get_param('email');
    $name  = $request->get_param('name');
    
    // Get user by email
    $user = get_user_by('email', $email);
    
    if (!$user) {
        return new WP_REST_Response(array(
            'success'   => true,
            'is_member' => false,
            'message'   => 'No user found with this email address',
            'data'      => array(
                'email_registered' => false,
                'name_matches'     => false,
                'has_membership'   => false,
            ),
        ), 200);
    }
    
    // Check if name matches (if provided)
    $name_matches = true;
    if (!empty($name)) {
        $name_matches = isir_verify_user_name($user, $name);
    }
    
    // Check membership status using Paid Memberships Pro
    $membership_data = isir_get_user_membership_status($user->ID);
    
    return new WP_REST_Response(array(
        'success'   => true,
        'is_member' => $membership_data['has_active_membership'] && $name_matches,
        'message'   => isir_get_status_message($membership_data, $name_matches, $name),
        'data'      => array(
            'email_registered'  => true,
            'name_matches'      => $name_matches,
            'has_membership'    => $membership_data['has_active_membership'],
            'membership_level'  => $membership_data['level_name'],
            'membership_status' => $membership_data['status'],
            'expiration_date'   => $membership_data['expiration_date'],
        ),
    ), 200);
}

/**
 * Verify if the provided name matches the user's name
 */
function isir_verify_user_name($user, $name) {
    $name = strtolower(trim($name));
    
    $first_name  = strtolower(get_user_meta($user->ID, 'first_name', true));
    $last_name   = strtolower(get_user_meta($user->ID, 'last_name', true));
    $display_name = strtolower($user->display_name);
    $full_name   = trim($first_name . ' ' . $last_name);
    
    // Check various name combinations
    $name_variations = array(
        $first_name,
        $last_name,
        $full_name,
        $display_name,
        $last_name . ' ' . $first_name, // Reversed order
    );
    
    foreach ($name_variations as $variation) {
        if (!empty($variation) && $variation === $name) {
            return true;
        }
        // Also check if the provided name contains or is contained in variations
        if (!empty($variation) && (strpos($variation, $name) !== false || strpos($name, $variation) !== false)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Get user's membership status from Paid Memberships Pro
 */
function isir_get_user_membership_status($user_id) {
    $default_response = array(
        'has_active_membership' => false,
        'level_name'            => null,
        'level_id'              => null,
        'status'                => 'none',
        'expiration_date'       => null,
    );
    
    // Check if PMPro is active
    if (!function_exists('pmpro_hasMembershipLevel')) {
        // Fallback: Check user meta or alternative membership plugins
        return $default_response;
    }
    
    // Get current membership level
    $membership_level = pmpro_getMembershipLevelForUser($user_id);
    
    if (empty($membership_level)) {
        return $default_response;
    }
    
    // Format expiration date
    $expiration_date = null;
    if (!empty($membership_level->enddate) && $membership_level->enddate !== '0000-00-00 00:00:00') {
        $expiration_date = date('Y-m-d', $membership_level->enddate);
    }
    
    // Check if membership is expired
    $is_expired = false;
    if (!empty($membership_level->enddate) && $membership_level->enddate < time()) {
        $is_expired = true;
    }
    
    return array(
        'has_active_membership' => !$is_expired,
        'level_name'            => $membership_level->name,
        'level_id'              => $membership_level->id,
        'status'                => $is_expired ? 'expired' : 'active',
        'expiration_date'       => $expiration_date,
    );
}

/**
 * Generate appropriate status message
 */
function isir_get_status_message($membership_data, $name_matches, $provided_name) {
    if (!$membership_data['has_active_membership']) {
        if ($membership_data['status'] === 'expired') {
            return 'Membership has expired';
        }
        return 'No active membership found';
    }
    
    if (!empty($provided_name) && !$name_matches) {
        return 'Email is registered but name does not match';
    }
    
    return 'Valid member with active ' . $membership_data['level_name'] . ' membership';
}

/**
 * Optional: Add admin settings page for API key management
 */
add_action('admin_menu', function() {
    add_options_page(
        'ISIR Member API Settings',
        'ISIR Member API',
        'manage_options',
        'isir-member-api',
        'isir_member_api_settings_page'
    );
});

function isir_member_api_settings_page() {
    if (isset($_POST['isir_api_key_nonce']) && wp_verify_nonce($_POST['isir_api_key_nonce'], 'isir_save_api_key')) {
        if (isset($_POST['regenerate_key'])) {
            $new_key = wp_generate_password(32, false);
            update_option('isir_member_api_key', $new_key);
            echo '<div class="notice notice-success"><p>API Key regenerated successfully!</p></div>';
        }
    }
    
    $current_key = get_option('isir_member_api_key', '');
    ?>
    <div class="wrap">
        <h1>ISIR Member API Settings</h1>
        <h2>API Endpoint</h2>
        <p><code><?php echo home_url('/wp-json/isir/v1/check-member'); ?></code></p>
        
        <h2>API Key</h2>
        <p>Current API Key: <code><?php echo esc_html($current_key ?: 'Not set (API is open)'); ?></code></p>
        
        <form method="post">
            <?php wp_nonce_field('isir_save_api_key', 'isir_api_key_nonce'); ?>
            <input type="submit" name="regenerate_key" class="button button-primary" value="Generate New API Key">
        </form>
        
        <h2>Usage Example</h2>
        <pre>
// JavaScript fetch example
fetch('<?php echo home_url('/wp-json/isir/v1/check-member'); ?>', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-ISIR-API-Key': 'your-api-key-here'
    },
    body: JSON.stringify({
        email: 'member@example.com',
        name: 'John Doe'
    })
})
.then(response => response.json())
.then(data => console.log(data));
        </pre>
        
        <h2>Response Format</h2>
        <pre>
{
    "success": true,
    "is_member": true,
    "message": "Valid member with active Premium membership",
    "data": {
        "email_registered": true,
        "name_matches": true,
        "has_membership": true,
        "membership_level": "Premium",
        "membership_status": "active",
        "expiration_date": "2027-01-12"
    }
}
        </pre>
    </div>
    <?php
}
