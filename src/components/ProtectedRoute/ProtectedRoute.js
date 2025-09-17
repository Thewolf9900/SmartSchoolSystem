import React from 'react';
import { Route, Redirect } from 'react-router-dom';

 
const ProtectedRoute = ({ component: Component, render, ...rest }) => {

    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <Route
            {...rest}
            render={props => { // "props" هنا هي خصائص المسار مثل history, location
                if (isAuthenticated) {
                    // إذا كان المستخدم مسجلاً للدخول...
                    // تحقق مما إذا كانت خاصية "render" موجودة واستخدمها،
                    // وإلا، استخدم خاصية "component".
                    return render ? render(props) : <Component {...props} />;
                } else {
                    // إذا لم يكن مسجلاً للدخول، أعد توجيهه.
                    return <Redirect to="/auth/login" />;
                }
            }}
        />
    );
};

export default ProtectedRoute;