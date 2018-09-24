var s_profiles = [];
var s_elements = null;

var s_default_speed = 0.0;
var s_default_v_center = 0.5;
var s_default_e_center = 0.5;
var s_default_axis = 'y';
var s_default_factor_x = 1.0;
var s_default_factor_y = 1.0;
var s_default_rel_element = '!self!';
var s_default_alpha = false;
var s_default_alpha_mode = 'actual';

var s_viewport_height = 0;
var s_viewport_width = 0;

sallax_register_profile('default', {});

function sallax_register_profile(profile_name, profile_data) {
    if ( s_profiles[profile_name] != undefined ) {
        sallax_error("Can not register new profile '"+profile_name+"' because it is also present.");
        return;
    }

    s_profiles[profile_name] = {};

    if ( profile_data.speed != undefined ) {
        s_profiles[profile_name].speed = profile_data.speed;
    } else {
        s_profiles[profile_name].speed = s_default_speed;
    }

    if ( profile_data.vcenter != undefined ) {
        s_profiles[profile_name].vcenter = profile_data.vcenter;
    } else {
        s_profiles[profile_name].vcenter = s_default_v_center;
    }

    if ( profile_data.ecenter != undefined ) {
        s_profiles[profile_name].ecenter = profile_data.ecenter;
    } else {
        s_profiles[profile_name].ecenter = s_default_e_center;
    }

    if ( profile_data.axis != undefined ) {
        s_profiles[profile_name].axis = profile_data.axis;
    } else {
        s_profiles[profile_name].axis = s_default_axis;
    }

    if ( profile_data.factorx != undefined ) {
        s_profiles[profile_name].factorx = profile_data.factorx;
    } else {
        s_profiles[profile_name].factorx = s_default_factor_x;
    }

    if ( profile_data.factory != undefined ) {
        s_profiles[profile_name].factory = profile_data.factory;
    } else {
        s_profiles[profile_name].factory = s_default_factor_y;
    }

    if ( profile_data.relelement != undefined ) {
        s_profiles[profile_name].relelement = profile_data.relelement;
    } else {
        s_profiles[profile_name].relelement = s_default_rel_element;
    }

    if ( profile_data.alpha != undefined ) {
        s_profiles[profile_name].alpha = profile_data.alpha;
    } else {
        s_profiles[profile_name].alpha = s_default_alpha;
    }

    if ( profile_data.alphamode != undefined ) {
        s_profiles[profile_name].alphamode = profile_data.alphamode;
    } else {
        s_profiles[profile_name].alphamode = s_default_alpha_mode;
    }
}

function sallax_log(message) {
    console.log("SALLAX: "+message);
}

function sallax_error(message) {
    console.error("SALLAX: "+message);
}

function sallax_setup() {
    window.addEventListener('scroll', sallax_update_scene, false);
    window.addEventListener('resize', sallax_refresh, false);

    s_viewport_height = window.innerHeight;
    s_viewport_width = window.innerWidth;

    var raw_elements = document.getElementsByClassName('sallax');
    s_elements = [];
    for ( var i = 0; i < raw_elements.length; i++ ) {
        s_elements.push(sallax_create_element_wrapper(raw_elements[i]));
    }
    sallax_update_scene();
}

function sallax_destroy() {
    window.removeEventListener('scroll', sallax_update_scene, false);
    window.removeEventListener('resize', sallax_refresh, false);

    for ( var i = 0; i < s_elements.length; i++ ) {
        var w = s_elements[i];
        w.element.style.opacity = "";
        set_translyte_y(w, 0);
        set_translyte_x(w, 0);
    }
    s_elements = null;
}

function sallax_refresh() {
    sallax_destroy();
    sallax_setup();
}

function sallax_apply_profile(wrapper, profile_name) {
    if ( s_profiles[profile_name] == null || s_profiles[profile_name] == undefined ) {
        sallax_error("Can not apply profile '"+profile_name+"' because it does not exist. Fallback: Applying default profile.");
        sallax_apply_profile(wrapper, 'default');
    } else {
        var profile = s_profiles[profile_name];
        wrapper.speed = profile.speed;
        wrapper.vcenter = profile.vcenter;
        wrapper.ecenter = profile.ecenter;
        wrapper.axis_x = (profile.axis.indexOf('x') >= 0);
        wrapper.axis_y = (profile.axis.indexOf('y') >= 0);
        wrapper.factor_x = profile.factorx;
        wrapper.factor_y = profile.factory;
        wrapper.relative_element = find_relative_element(wrapper.element, profile.relelement);
        if ( wrapper.relative_element == null ) wrapper.relative_element = wrapper.element;
        wrapper.alpha = profile.alpha;
        wrapper.alpha_actual = profile.alphamode.toLowerCase() != "corrected";
    }
}

function sallax_create_element_wrapper(element) {
    var wrapper = new Object();
    wrapper.element = element;

    if ( element.hasAttribute('data-profile') ) {
        sallax_apply_profile(wrapper, element.dataset.profile);
    } else {
        sallax_apply_profile(wrapper, 'default');
    }

    if ( element.hasAttribute('data-speed') ) {
        wrapper.speed = element.dataset.speed;
    }

    if ( element.hasAttribute('data-v-center') ) {
        wrapper.vcenter = element.dataset.vCenter;
    }

    if ( element.hasAttribute('data-e-center') ) {
        wrapper.ecenter = element.dataset.eCenter;
    }

    if ( element.hasAttribute('data-axis') ) {
        wrapper.axis_x = (element.dataset.axis.indexOf('x') >= 0);
        wrapper.axis_y = (element.dataset.axis.indexOf('y') >= 0);
    }

    if ( element.hasAttribute('data-factor-x') ) {
        wrapper.factor_x = element.dataset.factorX;
    }

    if ( element.hasAttribute('data-factor-y') ) {
        wrapper.factor_y = element.dataset.factorY;
    }

    if ( element.hasAttribute('data-rel-element') ) {
        wrapper.relative_element = find_relative_element(element, element.dataset.relElement);
        if ( wrapper.relative_element == null ) wrapper.relative_element = element;
    }

    if ( element.hasAttribute('data-alpha') ) {
        wrapper.alpha = element.dataset.alpha;
    }

    if ( element.hasAttribute('data-alpha-mode') ) {
        wrapper.alpha_actual = element.dataset.alphaMode.toLowerCase() != "corrected";
    }

    wrapper.t_x = 0;
    wrapper.t_y = 0;

    return wrapper;
}

function find_relative_element(root, selector) {
    var parent = root.parentNode;

    if ( selector.toLowerCase() == "!self!" ) {
        return root;
    }

    if ( selector.toLowerCase() == "!container!" ) {
        if ( parent == null || parent == undefined ) {
            sallax_error("Selector '!container!' failed because element has no container. Fallback: root itself is relative element.");
            return null;
        } else {
            return parent;
        }
    }

    if ( parent.tagName.toLowerCase() == "html" ) {
        sallax_error("Reached tag html. Found no relative element by selector '"+selector+"'. Fallback: root itself is relative element.");
        return null;
    }

    if ( selector.indexOf('.') == 0 ) {
        if ( parent.classList.contains(selector.substring(1)) ) {
            return parent;
        } else {
            return find_relative_element(parent, selector);
        }
    } else if ( selector.indexOf('#') == 0 ) {
        if ( parent.id == selector.substring(1) ) {
            return parent;
        } else {
            return find_relative_element(parent, selector);
        }
    } else if ( selector.indexOf('!') == 0 ) {
        if ( parent.tagName.toLowerCase() == selector.substring(1).toLowerCase() ) {
            return parent;
        } else {
            return find_relative_element(parent, selector);
        }
    } else {
        sallax_error("Selector '"+selector+"' is invalid. Fallback: root itself is relative element.");
        return root;
    }
}

function sallax_update_scene() {
    for ( var i = 0; i < s_elements.length; i++ ) {
        sallax_update_element(s_elements[i]);
    }
}

function sallax_update_element(wrapper) {
    var rect = wrapper.relative_element.getBoundingClientRect();

    var element_center_pos_actual = rect.top+(rect.height*wrapper.ecenter);
    var element_center_pos_corrected = element_center_pos_actual-wrapper.t_y;

    var viewport_center_pos = s_viewport_height*wrapper.vcenter;

    var u_corrected = (viewport_center_pos-element_center_pos_corrected)/(s_viewport_height*wrapper.vcenter);

    if ( wrapper.alpha ) {
        var percentage;

        if ( wrapper.alpha_actual ) {
            var u_actual = (viewport_center_pos-element_center_pos_actual)/(s_viewport_height*wrapper.vcenter);
            percentage = 1-Math.abs(u_actual);
        } else {
            percentage = 1-Math.abs(u_corrected);
        }

        wrapper.element.style.opacity = percentage;
    }

    if ( wrapper.speed != 0 ) {
        if ( wrapper.axis_y && wrapper.factor_y != 0 ) {
            var t_y = -1*u_corrected*s_viewport_height*0.1*wrapper.speed*wrapper.factor_y;
            set_translyte_y(wrapper, t_y);
        }

        if ( wrapper.axis_x && wrapper.factor_x != 0 ) {
            var t_x = -1*u_corrected*s_viewport_width*0.1*wrapper.speed*wrapper.factor_x;
            set_translyte_x(wrapper, t_x);
        }
    }
}

function set_translyte_y(wrapper, px) {
    wrapper.t_y = px;
    set_transform(wrapper.element, "translate("+wrapper.t_x+"px, "+wrapper.t_y+"px)");
}

function set_translyte_x(wrapper, px) {
    wrapper.t_x = px;
    set_transform(wrapper.element, "translate("+wrapper.t_x+"px, "+wrapper.t_y+"px)");
}

function set_transform(element, what) {
    element.style.webkitTransform = what;
    element.style.MozTransform = what;
    element.style.msTransform = what;
    element.style.OTransform = what;
    element.style.transform = what;
}
