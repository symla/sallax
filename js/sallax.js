var s_elements = null;

var s_default_speed = 0;
var s_default_v_center = 0.5;
var s_default_e_center = 0.5;

var s_viewport_height = 0;
var s_viewport_width = 0;

window.addEventListener('scroll', sallax_update_scene);
window.addEventListener('resize', sallax_refresh);

sallax_setup();

function sallax_log(message) {
    console.log("SALLAX: "+message);
}

function sallax_error(message) {
    console.error("SALLAX: "+message);
}

function sallax_setup() {
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

function sallax_create_element_wrapper(element) {
    var wrapper = new Object();
    wrapper.element = element;

    if ( element.hasAttribute('data-speed') ) {
        wrapper.speed = element.dataset.speed;
    } else {
        wrapper.speed = s_default_speed;
    }

    if ( element.hasAttribute('data-v-center') ) {
        wrapper.vcenter = element.dataset.vCenter;
    } else {
        wrapper.vcenter = s_default_v_center;
    }

    if ( element.hasAttribute('data-e-center') ) {
        wrapper.ecenter = element.dataset.eCenter;
    } else {
        wrapper.ecenter = s_default_e_center;
    }

    if ( element.hasAttribute('data-axis') ) {
        wrapper.axis_x = (element.dataset.axis.indexOf('x') >= 0);
        wrapper.axis_y = (element.dataset.axis.indexOf('y') >= 0);
    }  else {
        wrapper.axis_x = false;
        wrapper.axis_y = true;
    }

    if ( element.hasAttribute('data-factor-x') ) {
        wrapper.factor_x = element.dataset.factorX;
    } else {
        wrapper.factor_x = 1.0;
    }

    if ( element.hasAttribute('data-factor-y') ) {
        wrapper.factor_y = element.dataset.factorY;
    } else {
        wrapper.factor_y = 1.0;
    }

    if ( element.hasAttribute('data-rel-element') ) {
        wrapper.relative_element = find_relative_element(element, element.dataset.relElement);
        if ( wrapper.relative_element == null ) wrapper.relative_element = element;
    } else {
        wrapper.relative_element = wrapper.element;
    }

    if ( element.hasAttribute('data-alpha') ) {
        wrapper.alpha = element.dataset.alpha;
    } else {
        wrapper.alpha = false;
    }

    if ( element.hasAttribute('data-alpha-mode') ) {
        wrapper.alpha_actual = element.dataset.alphaMode.toLowerCase() != "corrected";
    } else {
        wrapper.alpha_actual = true;
    }

    wrapper.t_x = 0;
    wrapper.t_y = 0;

    return wrapper;
}

function find_relative_element(root, selector) {
    var parent = root.parentNode;

    if ( parent.tagName.toLowerCase() == "html" ) {
        sallax_error("Reached tag html. Found no relative element by selector '"+selector+"'. Fallback: root itself is relative element.'");
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

    var u_corrected = (viewport_center_pos-element_center_pos_corrected)/(s_viewport_height-viewport_center_pos);

    if ( wrapper.alpha ) {
        var percentage;

        if ( wrapper.alpha_actual ) {
            var u_actual = (viewport_center_pos-element_center_pos_actual)/(s_viewport_height-viewport_center_pos);
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
