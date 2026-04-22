import React from "react";
import { Header, Segment, Label } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";

const CourseSearchResultItem = ({ course }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <Segment onClick={handleClick} className="CourseSearchResultItem" style={{ cursor: 'pointer', marginBottom: '10px' }}>
      <Header>
        <Header.Content>
          {course.title || course.name}
          <Header.Subheader>
            <Label className="subject-pill">
              {course.subject?.code || course.subject} {course.number}
            </Label>
          </Header.Subheader>
        </Header.Content>
      </Header>
    </Segment>
  );
};

export default CourseSearchResultItem;
