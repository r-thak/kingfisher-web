import React from "react";
import { useNavigate } from "react-router-dom";

const CourseSearchResultItem = ({ course }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div onClick={handleClick} className="card CourseSearchResultItem" style={{ cursor: 'pointer', marginBottom: '10px' }}>
      <h3 className="medium-header" style={{ margin: 0 }}>
        {course.title || course.name}
        <div className="sub-header" style={{ marginTop: '0.25rem' }}>
          <span className="pill">
            {course.subject?.code || course.subject} {course.number}
          </span>
        </div>
      </h3>
    </div>
  );
};

export default CourseSearchResultItem;