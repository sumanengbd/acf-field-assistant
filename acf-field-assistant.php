<?php
/**
 * Plugin Name: ACF Field Assistant
 * Plugin URI:  https://github.com/sumanengbd/acf-field-assistant/
 * Description: Automatically generates smart placeholder suggestions inside the ACF field editor based on Field Label, Field Name, and Field Type. Works with standard fields, repeaters, and flexible content.
 * Version:     1.0.0
 * Author:      Suman Ali
 * Author URI:  https://github.com/sumanengbd/
 * Text Domain: acf-field-assistant
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 *
 * @package ACFFieldAssistant
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class ACF_Field_Assistant
 * Handles initialization and enqueuing of the ACF Field Assistant assets.
 */
class ACF_Field_Assistant {

	/**
	 * Version of the plugin.
	 *
	 * @var string
	 */
	const VERSION = '1.0.0';

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Enqueue scripts and styles ONLY on the ACF Field Group editor screen.
		add_action( 'acf/field_group/admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue assets on the ACF Field Group editor screen.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		// Enqueue Stylesheet.
		wp_enqueue_style(
			'acf-field-assistant-css',
			plugins_url( 'assets/css/acf-field-assistant.css', __FILE__ ),
			array(),
			self::VERSION
		);

		// Enqueue Javascript.
		wp_enqueue_script(
			'acf-field-assistant-js',
			plugins_url( 'assets/js/acf-field-assistant.js', __FILE__ ),
			array(), // Use empty array to avoid hard dependency block, but we interact with ACF JS elements.
			self::VERSION,
			true // Load in footer to ensure DOM is ready.
		);
	}
}

/**
 * Initialize the plugin.
 */
function acf_field_assistant_init() {
	new ACF_Field_Assistant();
}
add_action( 'plugins_loaded', 'acf_field_assistant_init' );
