import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { getCourse, getCourseGrades } from '../api';
import { useTheme } from '../context/ThemeContext';
import GpaTrendChart from '../components/GpaTrendChart';

function Course() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCourse(courseId),
      getCourseGrades(courseId)
    ])
    .then(([courseData, gradesData]) => {
      setCourse(courseData);
      setGrades(gradesData);
      document.title = `${courseData.subject?.code || courseData.subject} ${courseData.number} - Kingfisher`;
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="Course">
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui active centered inline loader large"></div>
          <p style={{ marginTop: '1rem' }}>Loading Course Data...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="Course">
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui large header">Course not found</div>
          <button className="ui secondary button" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const cum = grades?.cumulative || {};

  const distributionOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
      axisLabel: { color: theme === 'dark' ? '#eee' : '#333' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#eee' : '#333' }
    },
    series: [{
      name: 'Count',
      type: 'bar',
      data: [
        cum.aPlus || 0, cum.a || 0, cum.aMinus || 0,
        cum.bPlus || 0, cum.b || 0, cum.bMinus || 0,
        cum.cPlus || 0, cum.c || 0, cum.cMinus || 0,
        cum.dPlus || 0, cum.d || 0, cum.dMinus || 0,
        cum.f || 0
      ],
      itemStyle: { color: '#E84A27' }
    }]
  };

  const subjectCode = course.subject?.code || course.subject;

  return (
    <div className="Course">
      <div className="ui breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <a className="section" onClick={() => navigate('/')}>Home</a>
        <i className="right angle icon divider"></i>
        <a className="section" onClick={() => navigate(`/search?subject=${subjectCode}`)}>{subjectCode}</a>
        <i className="right angle icon divider"></i>
        <div className="active section">{course.number}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="ui huge header" style={{ margin: 0 }}>
          {course.title || course.name}
          <div className="sub header" style={{ fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {subjectCode} {course.number}
          </div>
        </div>
        <button className="ui secondary button" onClick={() => navigate(-1)}>
          Back to Results
        </button>
      </div>

      <div className="ui stackable grid">
        <div className="eleven wide column">
          {grades && (
            <>
              <div className="ui segment">
                <div className="ui medium header" style={{ marginBottom: '1.5rem' }}>Cumulative Grade Distribution</div>
                <ReactECharts
                  option={distributionOption}
                  style={{ height: '350px', width: '100%' }}
                  theme={theme === 'dark' ? 'dark' : undefined}
                />
              </div>

              <div className="ui segment">
                <GpaTrendChart courseOfferings={grades.courseOfferings || []} />
              </div>
            </>
          )}

          <div className="ui segment">
            <div className="ui medium header">Course Description</div>
            <p style={{ fontSize: '1.1em', lineHeight: '1.5' }}>
              {course.description || 'No description available for this course.'}
            </p>
          </div>
        </div>

        <div className="five wide column">
          <div className="ui segment">
            <div className="ui small header">Summary Stats</div>
            <div className="ui list">
              <div className="item">
                <div className="content">
                  <div className="header">Average GPA</div>
                  <div className="description" style={{ fontSize: '1.5em', color: '#E84A27', fontWeight: 'bold', marginTop: '0.2rem' }}>
                    {cum.gpa ? cum.gpa.toFixed(2) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="ui divider"></div>
              <div className="item">
                <div className="content">
                  <div className="header">Total Students</div>
                  <div className="description">{cum.total?.toLocaleString() || 0} students graded</div>
                </div>
              </div>
              <div className="ui divider"></div>
              {course.creditHours && (
                <div className="item">
                  <div className="content">
                    <div className="header">Credit Hours</div>
                    <div className="description">{course.creditHours} hours</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Course;
