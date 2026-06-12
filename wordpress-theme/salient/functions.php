<?php

/**
 * Salient functions and definitions.
 *
 * @package Salient
 * @since 1.0
 */


 /**
  * Define Constants.
  */
define( 'NECTAR_THEME_DIRECTORY', get_template_directory() );
define( 'NECTAR_FRAMEWORK_DIRECTORY', get_template_directory_uri() . '/nectar/' );
define( 'NECTAR_THEME_NAME', 'salient' );


if ( ! function_exists( 'get_nectar_theme_version' ) ) {
	function nectar_get_theme_version() {
		return '17.3.1';
	}
}


/**
 * Load text domain.
 */
add_action( 'after_setup_theme', 'nectar_lang_setup' );

if ( ! function_exists( 'nectar_lang_setup' ) ) {
	function nectar_lang_setup() {
		load_theme_textdomain( 'salient', get_template_directory() . '/lang' );
	}
}


/**
 * General WordPress.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/wp-general.php';


/**
 * Get Salient theme options.
 */
function get_nectar_theme_options() {

	$legacy_options  = get_option( 'salient' );
	$current_options = get_option( 'salient_redux' );

	if ( ! empty( $current_options ) && is_array($current_options) ) {
		return $current_options;
	} elseif ( ! empty( $legacy_options ) && is_array($legacy_options) ) {
		return $legacy_options;
	} else {
		return array();
	}
}

$nectar_options                    = get_nectar_theme_options();
$nectar_get_template_directory_uri = get_template_directory_uri();


require_once NECTAR_THEME_DIRECTORY . '/includes/class-nectar-theme-manager.php';


/**
 * Register/Enqueue theme assets.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/icon-collections.php';
require_once NECTAR_THEME_DIRECTORY . '/includes/class-nectar-element-assets.php';
require_once NECTAR_THEME_DIRECTORY . '/includes/class-nectar-element-styles.php';
require_once NECTAR_THEME_DIRECTORY . '/includes/class-nectar-lazy.php';
require_once NECTAR_THEME_DIRECTORY . '/includes/class-nectar-delay-js.php';
require_once NECTAR_THEME_DIRECTORY . '/includes/class-nectar-login.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/enqueue-scripts.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/enqueue-styles.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/dynamic-styles.php';


/**
 * Salient Plugin notices.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/plugin-notices/salient-plugin-notices.php';


/**
 * Salient welcome page.
 */
 require_once NECTAR_THEME_DIRECTORY . '/nectar/welcome/welcome-page.php';


/**
 * Theme hooks & actions.
 */
function nectar_hooks_init() {

	require_once NECTAR_THEME_DIRECTORY . '/nectar/hooks/hooks.php';
	require_once NECTAR_THEME_DIRECTORY . '/nectar/hooks/actions.php';

}

add_action( 'after_setup_theme', 'nectar_hooks_init', 10 );


/**
 * Post category meta.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/meta/category-meta.php';


/**
 * Media and theme image sizes.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/media.php';


/**
 * Navigation menus
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/assets/functions/wp-menu-custom-items/menu-item-custom-fields.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/nav-menus.php';


/**
 * TGM Plugin inclusion.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/tgm-plugin-activation/class-tgm-plugin-activation.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/tgm-plugin-activation/required_plugins.php';


/**
 * WPBakery functionality.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/wpbakery-init.php';


/**
 * Theme skin specific class and assets.
 */
$nectar_theme_skin    = NectarThemeManager::$skin;
$nectar_header_format = ( ! empty( $nectar_options['header_format'] ) ) ? $nectar_options['header_format'] : 'default';

add_filter( 'body_class', 'nectar_theme_skin_class' );

function nectar_theme_skin_class( $classes ) {
	global $nectar_theme_skin;
	$classes[] = $nectar_theme_skin;
	return $classes;
}


function nectar_theme_skin_css() {
	global $nectar_theme_skin;
	wp_enqueue_style( 'skin-' . $nectar_theme_skin );
}

add_action( 'wp_enqueue_scripts', 'nectar_theme_skin_css' );



/**
 * Search related.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/search.php';


/**
 * Register Widget areas.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/widget-related.php';


/**
 * Header navigation helpers.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/header.php';


/**
 * Blog helpers.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/blog.php';


/**
 * Page helpers.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/page.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/footer.php';

/**
 * Theme options panel (Redux).
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/redux-salient.php';


/**
 * WordPress block editor helpers (Gutenberg).
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/gutenberg.php';


/**
 * Admin assets.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/admin-enqueue.php';


/**
 * Pagination Helpers.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/pagination.php';


/**
 * Page header.
 */
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/page-header.php';


/**
 * Third party.
 */
require_once NECTAR_THEME_DIRECTORY . '/includes/third-party-integrations/seo.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/wpml.php';
require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/woocommerce.php';


/**
 * v10.5 update assist.
 */
 require_once NECTAR_THEME_DIRECTORY . '/nectar/helpers/update-assist.php';


// =============================================================================
// ISIR Member check via admin-ajax (NOT /wp-json — avoids REST API lock plugins).
// POST {site}/wp-admin/admin-ajax.php
// Form body: action=isir_check_member & email=... & name=... (optional name)
// Header optional: X-ISIR-API-Key (required when isir_member_api_key option is set)
// =============================================================================

if ( ! defined( 'ISIR_CHECK_MEMBER_ACTION' ) ) {
	define( 'ISIR_CHECK_MEMBER_ACTION', 'isir_check_member' );
}

/**
 * API key from request (Apache/nginx pass HTTP_X_ISIR_API_KEY).
 *
 * @return string
 */
function isir_member_get_request_api_key() {
	if ( ! empty( $_SERVER['HTTP_X_ISIR_API_KEY'] ) ) {
		return sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_ISIR_API_KEY'] ) );
	}
	return '';
}

/**
 * @return bool
 */
function isir_member_check_api_key_allows() {
	$valid = get_option( 'isir_member_api_key', '' );
	if ( '' === $valid || ! is_string( $valid ) ) {
		return true;
	}
	$got = isir_member_get_request_api_key();
	return is_string( $got ) && hash_equals( $valid, $got );
}

/**
 * @param string|null $level_name Level label.
 * @return bool
 */
function isir_is_non_member_level( $level_name ) {
	if ( empty( $level_name ) ) {
		return true;
	}

	$level_lower         = strtolower( $level_name );
	$non_member_keywords = array( 'non-member', 'non member', 'none', 'free', 'guest' );

	foreach ( $non_member_keywords as $keyword ) {
		if ( strpos( $level_lower, $keyword ) !== false ) {
			return true;
		}
	}

	return false;
}

/**
 * Build JSON payload for member check (same shape the conference app expects).
 *
 * @param string $email Email.
 * @param string $name  Optional display name for verification.
 * @return array
 */
function isir_build_check_member_response( $email, $name ) {
	$user = get_user_by( 'email', $email );

	if ( ! $user ) {
		return array(
			'success'   => true,
			'is_member' => false,
			'message'   => 'No user found with this email address',
			'data'      => array(
				'email_registered' => false,
				'name_matches'       => false,
				'has_membership'     => false,
				'user_info'          => null,
				'ticket_options'     => isir_get_ticket_options( null ),
			),
		);
	}

	$name_matches = true;
	if ( ! empty( $name ) ) {
		$name_matches = isir_verify_user_name( $user, $name );
	}

	$membership_data = isir_get_user_membership_status( $user->ID );

	$is_actual_member = $membership_data['has_active_membership'] &&
						! isir_is_non_member_level( $membership_data['level_name'] );

	$is_member = $is_actual_member && $name_matches;

	$user_info = array(
		'first_name'   => get_user_meta( $user->ID, 'first_name', true ),
		'last_name'    => get_user_meta( $user->ID, 'last_name', true ),
		'display_name' => $user->display_name,
		'email'        => $user->user_email,
		'institution'  => get_user_meta( $user->ID, 'pmpro_bcompany', true ) ? get_user_meta( $user->ID, 'pmpro_bcompany', true ) : get_user_meta( $user->ID, 'institution', true ),
		'phone'        => get_user_meta( $user->ID, 'pmpro_bphone', true ) ? get_user_meta( $user->ID, 'pmpro_bphone', true ) : get_user_meta( $user->ID, 'phone', true ),
		'address1'     => get_user_meta( $user->ID, 'pmpro_baddress1', true ),
		'address2'     => get_user_meta( $user->ID, 'pmpro_baddress2', true ),
		'city'         => get_user_meta( $user->ID, 'pmpro_bcity', true ),
		'state'        => get_user_meta( $user->ID, 'pmpro_bstate', true ),
		'zip'          => get_user_meta( $user->ID, 'pmpro_bzipcode', true ),
		'country'      => get_user_meta( $user->ID, 'pmpro_bcountry', true ),
	);

	$ticket_options = isir_get_ticket_options( $membership_data );

	$membership_level_display = null;
	if ( $is_actual_member && ! isir_is_non_member_level( $membership_data['level_name'] ) ) {
		$membership_level_display = $membership_data['level_name'];
	}

	return array(
		'success'   => true,
		'is_member' => $is_member,
		'message'   => isir_get_status_message( $membership_data, $name_matches, $name, $is_actual_member ),
		'data'      => array(
			'email_registered'    => true,
			'name_matches'        => $name_matches,
			'has_membership'      => $is_actual_member,
			'membership_level'    => $membership_level_display,
			'membership_level_id' => $is_actual_member ? $membership_data['level_id'] : null,
			'membership_status'   => $membership_data['status'],
			'expiration_date'     => $membership_data['expiration_date'],
			'is_trainee'          => $membership_data['is_trainee'],
			'user_info'           => $user_info,
			'ticket_options'      => $ticket_options,
		),
	);
}

/**
 * admin-ajax handler (logged-in and logged-out).
 */
function isir_ajax_check_member() {
	nocache_headers();
	if ( ! isir_member_check_api_key_allows() ) {
		wp_send_json(
			array(
				'success' => false,
				'message' => 'Unauthorized',
			),
			403
		);
	}
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$name  = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	if ( ! is_email( $email ) ) {
		wp_send_json(
			array(
				'success' => false,
				'message' => 'Valid email required',
			),
			400
		);
	}
	wp_send_json( isir_build_check_member_response( $email, $name ), 200 );
}

add_action( 'wp_ajax_' . ISIR_CHECK_MEMBER_ACTION, 'isir_ajax_check_member' );
add_action( 'wp_ajax_nopriv_' . ISIR_CHECK_MEMBER_ACTION, 'isir_ajax_check_member' );

/**
 * @param array|null $membership_data Membership array or null.
 * @return array
 */
function isir_get_ticket_options( $membership_data ) {
	$early_bird_deadline = strtotime( '2026-09-01' );
	$is_early_bird       = time() < $early_bird_deadline;

	$has_active_membership = null !== $membership_data &&
							$membership_data['has_active_membership'] &&
							! isir_is_non_member_level( $membership_data['level_name'] );
	$is_trainee = null !== $membership_data && $membership_data['is_trainee'];

	$all_tickets = array(
		'isir-member'          => array(
			'id'                  => 'isir-member',
			'label'               => 'ISIR Member',
			'description'         => 'Full conference access for ISIR members',
			'early_price'         => 350,
			'standard_price'      => 450,
			'requires_membership' => true,
			'trainee_only'        => false,
		),
		'non-member'           => array(
			'id'                  => 'non-member',
			'label'               => 'Non-Member',
			'description'         => 'Full conference access for non-members',
			'early_price'         => 650,
			'standard_price'      => 750,
			'requires_membership' => false,
			'trainee_only'        => false,
		),
		'trainee-member'       => array(
			'id'                  => 'trainee-member',
			'label'               => 'Trainee / Student Member',
			'description'         => 'Discounted rate for ISIR trainee/student members',
			'early_price'         => 150,
			'standard_price'      => 200,
			'requires_membership' => true,
			'trainee_only'        => true,
		),
		'trainee-non-member'   => array(
			'id'                  => 'trainee-non-member',
			'label'               => 'Trainee / Student Non-Member',
			'description'         => 'Discounted rate for trainee/student non-members',
			'early_price'         => 250,
			'standard_price'      => 300,
			'requires_membership' => false,
			'trainee_only'        => true,
		),
	);

	$accompanying = array(
		'id'             => 'accompanying',
		'label'          => 'Accompanying Person',
		'description'    => 'Social events access only',
		'early_price'    => 250,
		'standard_price' => 350,
		'available'      => true,
	);

	$available_tickets  = array();
	$recommended_ticket = null;

	if ( $has_active_membership ) {
		if ( $is_trainee ) {
			$trainee_member                  = $all_tickets['trainee-member'];
			$trainee_member['available']     = true;
			$trainee_member['current_price'] = $is_early_bird ? $trainee_member['early_price'] : $trainee_member['standard_price'];
			$trainee_member['is_early_bird'] = $is_early_bird;
			$available_tickets[]             = $trainee_member;

			$isir_member                  = $all_tickets['isir-member'];
			$isir_member['available']     = true;
			$isir_member['current_price'] = $is_early_bird ? $isir_member['early_price'] : $isir_member['standard_price'];
			$isir_member['is_early_bird'] = $is_early_bird;
			$available_tickets[]          = $isir_member;

			$recommended_ticket = 'trainee-member';
		} else {
			$isir_member                  = $all_tickets['isir-member'];
			$isir_member['available']     = true;
			$isir_member['current_price'] = $is_early_bird ? $isir_member['early_price'] : $isir_member['standard_price'];
			$isir_member['is_early_bird'] = $is_early_bird;
			$available_tickets[]          = $isir_member;

			$recommended_ticket = 'isir-member';
		}

		$non_member                       = $all_tickets['non-member'];
		$non_member['available']          = false;
		$non_member['unavailable_reason'] = 'You have an active membership - member tickets are available at a lower price';
		$non_member['current_price']      = $is_early_bird ? $non_member['early_price'] : $non_member['standard_price'];
		$non_member['is_early_bird']      = $is_early_bird;
		$available_tickets[]              = $non_member;

		$trainee_non_member                       = $all_tickets['trainee-non-member'];
		$trainee_non_member['available']          = false;
		$trainee_non_member['unavailable_reason'] = 'You have an active membership - member tickets are available at a lower price';
		$trainee_non_member['current_price']      = $is_early_bird ? $trainee_non_member['early_price'] : $trainee_non_member['standard_price'];
		$trainee_non_member['is_early_bird']      = $is_early_bird;
		$available_tickets[]                      = $trainee_non_member;
	} else {
		$isir_member                      = $all_tickets['isir-member'];
		$isir_member['available']         = false;
		$isir_member['unavailable_reason'] = 'ISIR membership required. Join ISIR to access member pricing!';
		$isir_member['current_price']     = $is_early_bird ? $isir_member['early_price'] : $isir_member['standard_price'];
		$isir_member['is_early_bird']     = $is_early_bird;
		$available_tickets[]              = $isir_member;

		$trainee_member                       = $all_tickets['trainee-member'];
		$trainee_member['available']          = false;
		$trainee_member['unavailable_reason'] = 'ISIR membership required. Join ISIR to access member pricing!';
		$trainee_member['current_price']      = $is_early_bird ? $trainee_member['early_price'] : $trainee_member['standard_price'];
		$trainee_member['is_early_bird']      = $is_early_bird;
		$available_tickets[]                  = $trainee_member;

		$non_member                  = $all_tickets['non-member'];
		$non_member['available']     = true;
		$non_member['current_price'] = $is_early_bird ? $non_member['early_price'] : $non_member['standard_price'];
		$non_member['is_early_bird'] = $is_early_bird;
		$available_tickets[]         = $non_member;

		$trainee_non_member                  = $all_tickets['trainee-non-member'];
		$trainee_non_member['available']     = true;
		$trainee_non_member['current_price'] = $is_early_bird ? $trainee_non_member['early_price'] : $trainee_non_member['standard_price'];
		$trainee_non_member['is_early_bird'] = $is_early_bird;
		$available_tickets[]                 = $trainee_non_member;

		$recommended_ticket = 'non-member';
	}

	$accompanying['current_price'] = $is_early_bird ? $accompanying['early_price'] : $accompanying['standard_price'];
	$accompanying['is_early_bird'] = $is_early_bird;

	return array(
		'available_tickets'  => $available_tickets,
		'recommended_ticket' => $recommended_ticket,
		'accompanying'       => $accompanying,
		'is_early_bird'      => $is_early_bird,
		'early_bird_deadline' => date( 'Y-m-d', $early_bird_deadline ),
	);
}

/**
 * @param WP_User $user User.
 * @param string  $name Name submitted.
 * @return bool
 */
function isir_verify_user_name( $user, $name ) {
	$name         = strtolower( trim( $name ) );
	$first_name   = strtolower( get_user_meta( $user->ID, 'first_name', true ) );
	$last_name    = strtolower( get_user_meta( $user->ID, 'last_name', true ) );
	$display_name = strtolower( $user->display_name );
	$full_name    = trim( $first_name . ' ' . $last_name );

	$name_variations = array(
		$first_name,
		$last_name,
		$full_name,
		$display_name,
		$last_name . ' ' . $first_name,
	);

	foreach ( $name_variations as $variation ) {
		if ( ! empty( $variation ) && $variation === $name ) {
			return true;
		}
		if ( ! empty( $variation ) && ( strpos( $variation, $name ) !== false || strpos( $name, $variation ) !== false ) ) {
			return true;
		}
	}

	return false;
}

/**
 * @param int $user_id User ID.
 * @return array
 */
function isir_get_user_membership_status( $user_id ) {
	$default_response = array(
		'has_active_membership' => false,
		'level_name'            => null,
		'level_id'              => null,
		'status'                => 'none',
		'expiration_date'       => null,
		'is_trainee'            => false,
	);

	if ( ! function_exists( 'pmpro_hasMembershipLevel' ) ) {
		return $default_response;
	}

	$membership_level = pmpro_getMembershipLevelForUser( $user_id );

	if ( empty( $membership_level ) ) {
		return $default_response;
	}

	$expiration_date = null;
	if ( ! empty( $membership_level->enddate ) && '0000-00-00 00:00:00' !== $membership_level->enddate ) {
		$expiration_date = date( 'Y-m-d', $membership_level->enddate );
	}

	$is_expired = false;
	if ( ! empty( $membership_level->enddate ) && $membership_level->enddate < time() ) {
		$is_expired = true;
	}

	$trainee_level_ids = array( 2, 3 );
	$trainee_keywords  = array( 'trainee', 'student', 'fellow', 'resident', 'postdoc' );

	$is_trainee = false;

	if ( in_array( $membership_level->id, $trainee_level_ids, true ) ) {
		$is_trainee = true;
	}

	$level_name_lower = strtolower( $membership_level->name );
	foreach ( $trainee_keywords as $keyword ) {
		if ( strpos( $level_name_lower, $keyword ) !== false ) {
			$is_trainee = true;
			break;
		}
	}

	return array(
		'has_active_membership' => ! $is_expired,
		'level_name'            => $membership_level->name,
		'level_id'              => $membership_level->id,
		'status'                => $is_expired ? 'expired' : 'active',
		'expiration_date'       => $expiration_date,
		'is_trainee'            => $is_trainee,
	);
}

/**
 * @param array  $membership_data Membership.
 * @param bool   $name_matches Name ok.
 * @param string $provided_name Submitted name.
 * @param bool   $is_actual_member Is paying member level.
 * @return string
 */
function isir_get_status_message( $membership_data, $name_matches, $provided_name, $is_actual_member = false ) {
	if ( ! $is_actual_member ) {
		if ( 'expired' === $membership_data['status'] ) {
			return 'Membership has expired';
		}
		if ( isir_is_non_member_level( $membership_data['level_name'] ) ) {
			return 'No active ISIR membership found';
		}
		return 'No active membership found';
	}

	if ( ! empty( $provided_name ) && ! $name_matches ) {
		return 'Email is registered but name does not match';
	}

	return 'Valid member with active ' . $membership_data['level_name'] . ' membership';
}

add_action(
	'admin_menu',
	function () {
		add_options_page(
			'ISIR Member API Settings',
			'ISIR Member API',
			'manage_options',
			'isir-member-api',
			'isir_member_api_settings_page'
		);
	}
);

/**
 * Settings → ISIR Member API
 */
function isir_member_api_settings_page() {
	if ( isset( $_POST['isir_api_key_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['isir_api_key_nonce'] ) ), 'isir_save_api_key' ) ) {
		if ( isset( $_POST['regenerate_key'] ) ) {
			$new_key = wp_generate_password( 32, false );
			update_option( 'isir_member_api_key', $new_key );
			echo '<div class="notice notice-success"><p>API Key regenerated successfully!</p></div>';
		}
	}

	$current_key = get_option( 'isir_member_api_key', '' );
	?>
	<div class="wrap">
		<h1>ISIR Member API Settings</h1>
		<h2>Endpoint (admin-ajax, not REST)</h2>
		<p><code><?php echo esc_html( admin_url( 'admin-ajax.php' ) ); ?></code></p>
		<p>POST form fields: <code>action=<?php echo esc_html( ISIR_CHECK_MEMBER_ACTION ); ?></code>, <code>email</code>, optional <code>name</code>. Header <code>X-ISIR-API-Key</code> if an API key is configured below.</p>

		<h2>API Key</h2>
		<p>Current API Key: <code><?php echo esc_html( $current_key ? $current_key : 'Not set (API is open)' ); ?></code></p>

		<form method="post">
			<?php wp_nonce_field( 'isir_save_api_key', 'isir_api_key_nonce' ); ?>
			<input type="submit" name="regenerate_key" class="button button-primary" value="Generate New API Key">
		</form>
	</div>
	<?php
}
