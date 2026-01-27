/**
 * ISIR Member Verification API - FIXED VERSION
 * 
 * Fixed to properly handle "Non-Member" levels and only show member status
 * when user has an actual membership level (not "Non-Member")
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
			'https://isir2026.org',
			'https://www.isir2026.org',
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
			'https://isir2026.org',
			'https://www.isir2026.org',
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
    // Temporarily allow public access for testing
    return true;
    
    // Option 2: Check for API key in header (re-enable after testing)
    /*
    $api_key = $request->get_header('X-ISIR-API-Key');
    $valid_api_key = get_option('isir_member_api_key', '');
    
    if (empty($valid_api_key)) {
        // If no API key is set, allow access (for initial setup)
        return true;
    }
    
    return hash_equals($valid_api_key, $api_key);
    */
}

/**
 * Check if a membership level name indicates a non-member status
 */
function isir_is_non_member_level($level_name) {
    if (empty($level_name)) {
        return true;
    }
    
    $level_lower = strtolower($level_name);
    $non_member_keywords = array('non-member', 'non member', 'none', 'free', 'guest');
    
    foreach ($non_member_keywords as $keyword) {
        if (strpos($level_lower, $keyword) !== false) {
            return true;
        }
    }
    
    return false;
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
                'user_info'        => null,
                'ticket_options'   => isir_get_ticket_options(null),
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
    
    // FIXED: Check if membership level is actually a non-member level
    $is_actual_member = $membership_data['has_active_membership'] && 
                        !isir_is_non_member_level($membership_data['level_name']);
    
    // Only consider them a member if they have active membership AND it's not a "Non-Member" level
    $is_member = $is_actual_member && $name_matches;
    
    // Get user info for pre-filling registration form
    $user_info = array(
        'first_name'   => get_user_meta($user->ID, 'first_name', true),
        'last_name'    => get_user_meta($user->ID, 'last_name', true),
        'display_name' => $user->display_name,
        'email'        => $user->user_email,
        'institution'  => get_user_meta($user->ID, 'pmpro_bcompany', true) ?: get_user_meta($user->ID, 'institution', true),
        'phone'        => get_user_meta($user->ID, 'pmpro_bphone', true) ?: get_user_meta($user->ID, 'phone', true),
        'address1'     => get_user_meta($user->ID, 'pmpro_baddress1', true),
        'address2'     => get_user_meta($user->ID, 'pmpro_baddress2', true),
        'city'         => get_user_meta($user->ID, 'pmpro_bcity', true),
        'state'        => get_user_meta($user->ID, 'pmpro_bstate', true),
        'zip'          => get_user_meta($user->ID, 'pmpro_bzipcode', true),
        'country'      => get_user_meta($user->ID, 'pmpro_bcountry', true),
    );
    
    // Determine ticket options based on membership
    $ticket_options = isir_get_ticket_options($membership_data);
    
    // FIXED: Only return membership_level if it's not a non-member level
    $membership_level_display = null;
    if ($is_actual_member && !isir_is_non_member_level($membership_data['level_name'])) {
        $membership_level_display = $membership_data['level_name'];
    }
    
    return new WP_REST_Response(array(
        'success'   => true,
        'is_member' => $is_member,
        'message'   => isir_get_status_message($membership_data, $name_matches, $name, $is_actual_member),
        'data'      => array(
            'email_registered'  => true,
            'name_matches'      => $name_matches,
            'has_membership'    => $is_actual_member, // Use fixed check
            'membership_level'  => $membership_level_display, // Only return if actual member
            'membership_level_id' => $is_actual_member ? $membership_data['level_id'] : null,
            'membership_status' => $membership_data['status'],
            'expiration_date'   => $membership_data['expiration_date'],
            'is_trainee'        => $membership_data['is_trainee'],
            'user_info'         => $user_info,
            'ticket_options'    => $ticket_options,
        ),
    ), 200);
}

/**
 * Get available ticket options based on membership status
 * Modified to show member prices to non-members but restrict selection to members only
 */
function isir_get_ticket_options($membership_data) {
    // Early bird deadline
    $early_bird_deadline = strtotime('2026-07-10');
    $is_early_bird = time() < $early_bird_deadline;
    
    // FIXED: Check if user has actual membership (not "Non-Member" level)
    $has_active_membership = $membership_data !== null && 
                            $membership_data['has_active_membership'] &&
                            !isir_is_non_member_level($membership_data['level_name']);
    $is_trainee = $membership_data !== null && $membership_data['is_trainee'];
    
    // Base ticket types with pricing
    $all_tickets = array(
        'isir-member' => array(
            'id'          => 'isir-member',
            'label'       => 'ISIR Member',
            'description' => 'Full conference access for ISIR members',
            'early_price' => 350,
            'standard_price' => 450,
            'requires_membership' => true,
            'trainee_only' => false,
        ),
        'non-member' => array(
            'id'          => 'non-member',
            'label'       => 'Non-Member',
            'description' => 'Full conference access for non-members',
            'early_price' => 650,
            'standard_price' => 750,
            'requires_membership' => false,
            'trainee_only' => false,
        ),
        'trainee-member' => array(
            'id'          => 'trainee-member',
            'label'       => 'Trainee / Student Member',
            'description' => 'Discounted rate for ISIR trainee/student members',
            'early_price' => 150,
            'standard_price' => 200,
            'requires_membership' => true,
            'trainee_only' => true,
        ),
        'trainee-non-member' => array(
            'id'          => 'trainee-non-member',
            'label'       => 'Trainee / Student Non-Member',
            'description' => 'Discounted rate for trainee/student non-members',
            'early_price' => 250,
            'standard_price' => 300,
            'requires_membership' => false,
            'trainee_only' => true,
        ),
    );
    
    // Accompanying person pricing
    $accompanying = array(
        'id'          => 'accompanying',
        'label'       => 'Accompanying Person',
        'description' => 'Social events access only',
        'early_price' => 250,
        'standard_price' => 350,
        'available'   => true, // Always available
    );
    
    // Build ticket list - always show all tickets with prices, but mark availability
    $available_tickets = array();
    $recommended_ticket = null;
    
    // Always include member tickets (for price visibility) but mark as unavailable for non-members
    if ($has_active_membership) {
        // User has active membership - can select member tickets
        if ($is_trainee) {
            // Trainee member - can select trainee member ticket
            $trainee_member = $all_tickets['trainee-member'];
            $trainee_member['available'] = true;
            $trainee_member['current_price'] = $is_early_bird ? $trainee_member['early_price'] : $trainee_member['standard_price'];
            $trainee_member['is_early_bird'] = $is_early_bird;
            $available_tickets[] = $trainee_member;
            
            // Also show regular member ticket as available (can upgrade)
            $isir_member = $all_tickets['isir-member'];
            $isir_member['available'] = true;
            $isir_member['current_price'] = $is_early_bird ? $isir_member['early_price'] : $isir_member['standard_price'];
            $isir_member['is_early_bird'] = $is_early_bird;
            $available_tickets[] = $isir_member;
            
            $recommended_ticket = 'trainee-member';
        } else {
            // Regular member - can select member ticket
            $isir_member = $all_tickets['isir-member'];
            $isir_member['available'] = true;
            $isir_member['current_price'] = $is_early_bird ? $isir_member['early_price'] : $isir_member['standard_price'];
            $isir_member['is_early_bird'] = $is_early_bird;
            $available_tickets[] = $isir_member;
            
            $recommended_ticket = 'isir-member';
        }
        
        // Show non-member tickets but mark as unavailable (members shouldn't need these)
        $non_member = $all_tickets['non-member'];
        $non_member['available'] = false;
        $non_member['unavailable_reason'] = 'You have an active membership - member tickets are available at a lower price';
        $non_member['current_price'] = $is_early_bird ? $non_member['early_price'] : $non_member['standard_price'];
        $non_member['is_early_bird'] = $is_early_bird;
        $available_tickets[] = $non_member;
        
        $trainee_non_member = $all_tickets['trainee-non-member'];
        $trainee_non_member['available'] = false;
        $trainee_non_member['unavailable_reason'] = 'You have an active membership - member tickets are available at a lower price';
        $trainee_non_member['current_price'] = $is_early_bird ? $trainee_non_member['early_price'] : $trainee_non_member['standard_price'];
        $trainee_non_member['is_early_bird'] = $is_early_bird;
        $available_tickets[] = $trainee_non_member;
    } else {
        // No active membership - show member prices but mark as unavailable
        // Show member tickets first (with prices visible) but mark as unavailable
        $isir_member = $all_tickets['isir-member'];
        $isir_member['available'] = false;
        $isir_member['unavailable_reason'] = 'ISIR membership required. Join ISIR to access member pricing!';
        $isir_member['current_price'] = $is_early_bird ? $isir_member['early_price'] : $isir_member['standard_price'];
        $isir_member['is_early_bird'] = $is_early_bird;
        $available_tickets[] = $isir_member;
        
        $trainee_member = $all_tickets['trainee-member'];
        $trainee_member['available'] = false;
        $trainee_member['unavailable_reason'] = 'ISIR membership required. Join ISIR to access member pricing!';
        $trainee_member['current_price'] = $is_early_bird ? $trainee_member['early_price'] : $trainee_member['standard_price'];
        $trainee_member['is_early_bird'] = $is_early_bird;
        $available_tickets[] = $trainee_member;
        
        // Show non-member tickets as available
        $non_member = $all_tickets['non-member'];
        $non_member['available'] = true;
        $non_member['current_price'] = $is_early_bird ? $non_member['early_price'] : $non_member['standard_price'];
        $non_member['is_early_bird'] = $is_early_bird;
        $available_tickets[] = $non_member;
        
        $trainee_non_member = $all_tickets['trainee-non-member'];
        $trainee_non_member['available'] = true;
        $trainee_non_member['current_price'] = $is_early_bird ? $trainee_non_member['early_price'] : $trainee_non_member['standard_price'];
        $trainee_non_member['is_early_bird'] = $is_early_bird;
        $available_tickets[] = $trainee_non_member;
        
        $recommended_ticket = 'non-member';
    }
    
    $accompanying['current_price'] = $is_early_bird ? $accompanying['early_price'] : $accompanying['standard_price'];
    $accompanying['is_early_bird'] = $is_early_bird;
    
    return array(
        'available_tickets'  => $available_tickets,
        'recommended_ticket' => $recommended_ticket,
        'accompanying'       => $accompanying,
        'is_early_bird'      => $is_early_bird,
        'early_bird_deadline' => date('Y-m-d', $early_bird_deadline),
    );
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
        'is_trainee'            => false,
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
    
    // Detect trainee/student membership level
    // Adjust these level IDs or names to match your PMPro setup
    $trainee_level_ids = array(2, 3); // Add your trainee level IDs here
    $trainee_keywords = array('trainee', 'student', 'fellow', 'resident', 'postdoc');
    
    $is_trainee = false;
    
    // Check by level ID
    if (in_array($membership_level->id, $trainee_level_ids)) {
        $is_trainee = true;
    }
    
    // Check by level name (case-insensitive)
    $level_name_lower = strtolower($membership_level->name);
    foreach ($trainee_keywords as $keyword) {
        if (strpos($level_name_lower, $keyword) !== false) {
            $is_trainee = true;
            break;
        }
    }
    
    return array(
        'has_active_membership' => !$is_expired,
        'level_name'            => $membership_level->name,
        'level_id'              => $membership_level->id,
        'status'                => $is_expired ? 'expired' : 'active',
        'expiration_date'       => $expiration_date,
        'is_trainee'            => $is_trainee,
    );
}

/**
 * Generate appropriate status message
 */
function isir_get_status_message($membership_data, $name_matches, $provided_name, $is_actual_member = false) {
    if (!$is_actual_member) {
        if ($membership_data['status'] === 'expired') {
            return 'Membership has expired';
        }
        if (isir_is_non_member_level($membership_data['level_name'])) {
            return 'No active ISIR membership found';
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
