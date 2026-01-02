import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { Nav, Collapse, Button } from "react-bootstrap";

function Sidebar({ color, image, routes }) {
  const location = useLocation();

  const activeRoute = (routeName) => {
    return location.pathname.indexOf(routeName) > -1 ? "active" : "";
  };

  const closeSidebar = () => {
    document.documentElement.classList.remove("nav-open");
    const element = document.getElementById("bodyClick");
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  const [open, setOpen] = useState(() => {
    let initialState = {};
    if (routes) {
      routes.forEach(prop => {
        if (prop.children) {
          const isChildActive = prop.children.some(child =>
            location.pathname.includes(child.layout + child.path)
          );
          if (isChildActive) {
            initialState[prop.path] = true;
          }
        }
      });
    }
    return initialState;
  });

  // هذا الـ useEffect سيضمن إغلاق القوائم عند التنقل بعيدًا
  useEffect(() => {
    let shouldBeOpen = {};
    if (routes) {
      routes.forEach(prop => {
        if (prop.children) {
          const isChildActive = prop.children.some(child =>
            location.pathname.includes(child.layout + child.path)
          );
          if (isChildActive) {
            shouldBeOpen[prop.path] = true;
          }
        }
      });
    }
    setOpen(shouldBeOpen);
  }, [location.pathname, routes]);

  const toggleSubmenu = (e, path) => {
    e.preventDefault();
    setOpen(prevOpen => ({
      // أغلق كل القوائم الأخرى عند فتح قائمة جديدة
      ...Object.keys(prevOpen).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [path]: !prevOpen[path]
    }));
  };

  return (
    <div className="sidebar" data-image={image} data-color={color}>
      <div className="sidebar-background" style={{ backgroundImage: "url(" + image + ")" }} />
      <div className="sidebar-wrapper">
        <div className="logo d-flex align-items-center justify-content-between px-3">
          <div className="d-flex align-items-center">
            <a href="#" className="simple-text logo-mini mx-1">
              <div className="logo-img">
                {/* <img src={require("assets/img/reactlogo.png")} alt="..." /> */}
              </div>
            </a>
            <a className="simple-text" href="#" style={{ color: 'skyblue', textDecoration: 'none', fontSize: '25px' }}>smart school</a>
          </div>
          <Button
            className="d-lg-none d-flex align-items-center justify-content-center p-2 rounded-circle"
            onClick={closeSidebar}
            variant="danger"
            style={{
              width: '35px',
              height: '35px',
              opacity: 0.9,
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            <i className="fas fa-times" style={{ fontSize: '18px' }}></i>
          </Button>
        </div>
        <Nav as="ul">
          {routes.map((prop) => {
            if (prop.children) {
              return (
                <li className={activeRoute(prop.layout + prop.path)} key={prop.path}>
                  <NavLink
                    to={prop.layout + prop.path}
                    className="nav-link"
                    activeClassName="active"
                    onClick={(e) => toggleSubmenu(e, prop.path)}
                  >
                    <i className={prop.icon} />
                    <p>{prop.name} <b className={open[prop.path] ? "caret-down" : "caret"}></b></p>
                  </NavLink>
                  <Collapse in={open[prop.path]}>
                    <div>
                      <Nav as="ul" className="flex-column">
                        {prop.children.map((child) => (
                          <li className={activeRoute(child.layout + child.path)} key={child.path}>
                            <NavLink
                              to={child.layout + child.path}
                              className="nav-link"
                              activeClassName="active"
                            >
                              <i className={child.icon} />
                              <p>{child.name}</p>
                            </NavLink>
                          </li>
                        ))}
                      </Nav>
                    </div>
                  </Collapse>
                </li>
              );
            }
            if (!prop.redirect)
              return (
                <li className={activeRoute(prop.layout + prop.path)} key={prop.path}>
                  <NavLink
                    to={prop.layout + prop.path}
                    className="nav-link"
                    activeClassName="active"
                  >
                    <i className={prop.icon} />
                    <p>{prop.name}</p>
                  </NavLink>
                </li>
              );
            return null;
          })}
        </Nav>
      </div>
    </div>
  );
}

export default Sidebar;